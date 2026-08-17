<?php

use App\Models\Activity;
use App\Models\Setting;
use App\Models\User;
use App\Services\Admin\AuditLogger;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(SettingSeeder::class);

    $this->admin = User::factory()->role('administrator')->create();
    $this->employer = User::factory()->role('employer')->create();
});

// ---------------------------------------------------------------- settings

it('refuses settings to users without the permission', function () {
    actingAs($this->employer)->getJson('/api/v1/admin/settings')->assertForbidden();
});

it('groups settings to match the screen tabs', function () {
    $data = actingAs($this->admin)->getJson('/api/v1/admin/settings')->assertOk()->json('data');

    expect($data)->toHaveKeys(['general', 'site', 'users', 'security', 'seo'])
        ->and(collect($data['general'])->pluck('key'))->toContain('site_name');
});

it('casts typed values rather than returning raw strings', function () {
    $data = actingAs($this->admin)->getJson('/api/v1/admin/settings?group=users')->json('data.users');

    $flag = collect($data)->firstWhere('key', 'registration_enabled');

    // Stored as the string "1"; a caller should not have to know that.
    expect($flag['value'])->toBeBool()->toBeTrue();
});

it('saves a batch of settings in one request', function () {
    actingAs($this->admin)
        ->putJson('/api/v1/admin/settings', [
            'settings' => [
                ['key' => 'site_name', 'value' => 'Energy Tail Portal'],
                ['key' => 'jobs_per_page', 'value' => 25],
                ['key' => 'maintenance_mode', 'value' => true],
            ],
        ])
        ->assertOk();

    expect(Setting::where('key', 'site_name')->value('value'))->toBe('Energy Tail Portal')
        ->and(Setting::where('key', 'jobs_per_page')->first()->typedValue())->toBe(25)
        ->and(Setting::where('key', 'maintenance_mode')->first()->typedValue())->toBeTrue();
});

it('rejects an unknown setting key', function () {
    actingAs($this->admin)
        ->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'not_a_real_setting', 'value' => 'x']],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('settings.0.key');
});

it('records settings changes in the audit log', function () {
    actingAs($this->admin)
        ->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'site_name', 'value' => 'Renamed']],
        ])
        ->assertOk();

    $entry = Activity::where('module', 'settings')->latest()->first();

    expect($entry)->not->toBeNull()
        ->and($entry->description)->toContain('site_name')
        ->and($entry->actor_role)->toBe('administrator');
});

it('uploads a logo and replaces the previous file', function () {
    Storage::fake('public');

    actingAs($this->admin)
        ->postJson('/api/v1/admin/settings/file', [
            'key' => 'site_logo',
            'file' => UploadedFile::fake()->image('logo.png'),
        ])
        ->assertOk()
        ->assertJsonPath('data.key', 'site_logo');

    $first = Setting::where('key', 'site_logo')->value('value');
    Storage::disk('public')->assertExists($first);

    actingAs($this->admin)
        ->postJson('/api/v1/admin/settings/file', [
            'key' => 'site_logo',
            'file' => UploadedFile::fake()->image('logo-v2.png'),
        ])
        ->assertOk();

    // Replaced logos would otherwise accumulate on disk forever.
    Storage::disk('public')->assertMissing($first);
});

it('refuses a file upload for a non-file setting', function () {
    Storage::fake('public');

    actingAs($this->admin)
        ->postJson('/api/v1/admin/settings/file', [
            'key' => 'site_name',
            'file' => UploadedFile::fake()->image('logo.png'),
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'invalid_setting_type');
});

// --------------------------------------------------------- public settings

it('serves public settings without authentication', function () {
    $data = getJson('/api/v1/settings')->assertOk()->json('data');

    expect($data)->toHaveKey('site_name')
        ->and($data['site_name'])->toBe('Energy Tail');
});

it('never exposes private settings publicly', function () {
    Setting::where('key', 'recaptcha_secret_key')->update(['value' => 'super-secret']);

    $data = getJson('/api/v1/settings')->assertOk()->json('data');

    expect($data)->not->toHaveKey('recaptcha_secret_key')
        ->and(json_encode($data))->not->toContain('super-secret');
});

it('refreshes public settings after an admin change', function () {
    getJson('/api/v1/settings')->assertOk();

    actingAs($this->admin)
        ->putJson('/api/v1/admin/settings', [
            'settings' => [['key' => 'site_name', 'value' => 'Changed Name']],
        ])
        ->assertOk();

    // A stale cache here would look like the save silently failed.
    expect(getJson('/api/v1/settings')->json('data.site_name'))->toBe('Changed Name');
});

// -------------------------------------------------------------- audit logs

it('refuses audit logs without the permission', function () {
    actingAs($this->employer)->getJson('/api/v1/admin/audit-logs')->assertForbidden();
});

it('records sign-ins under the auth module', function () {
    postJson('/api/v1/auth/login', [
        'email' => $this->admin->email,
        'password' => 'password',
    ])->assertOk();

    $entry = Activity::where('module', 'auth')->where('action', 'login')->latest()->first();

    expect($entry)->not->toBeNull()
        ->and($entry->actor_name)->toBe($this->admin->full_name)
        ->and($entry->status)->toBe('success');
});

it('records failed sign-in attempts', function () {
    postJson('/api/v1/auth/login', [
        'email' => $this->admin->email,
        'password' => 'WrongPassword1!',
    ])->assertStatus(422);

    $entry = Activity::where('action', 'login_failed')->latest()->first();

    // Failed attempts matter more than successes for spotting an attack.
    expect($entry)->not->toBeNull()
        ->and($entry->status)->toBe('failed')
        ->and($entry->description)->toContain($this->admin->email);
});

it('filters the audit log by module, action, role and status', function () {
    $logger = app(AuditLogger::class);

    $logger->log('jobs', 'created', 'Created a job', actor: $this->admin);
    $logger->log('users', 'deleted', 'Deleted a user', actor: $this->admin);
    $logger->log('jobs', 'updated', 'Updated a job', actor: $this->admin, status: 'failed');

    expect(actingAs($this->admin)->getJson('/api/v1/admin/audit-logs?module=jobs')->json('meta.total'))->toBe(2)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/audit-logs?action=deleted')->json('meta.total'))->toBe(1)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/audit-logs?status=failed')->json('meta.total'))->toBe(1)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/audit-logs?role=administrator')->json('meta.total'))->toBe(3);
});

it('filters the audit log by date range', function () {
    $logger = app(AuditLogger::class);

    $old = $logger->log('jobs', 'created', 'Ten days ago', actor: $this->admin);

    // forceFill rather than update(): created_at is not fillable, so a plain
    // update() would silently leave the timestamp untouched.
    $old->forceFill(['created_at' => now()->subDays(10)])->save();

    $logger->log('jobs', 'created', 'Today', actor: $this->admin);

    $today = now()->toDateString();

    $recent = actingAs($this->admin)
        ->getJson("/api/v1/admin/audit-logs?module=jobs&from={$today}")
        ->json('data');

    expect($recent)->toHaveCount(1)
        ->and($recent[0]['description'])->toBe('Today');

    // Widening the range brings the older entry back.
    $all = actingAs($this->admin)
        ->getJson('/api/v1/admin/audit-logs?module=jobs&from='.now()->subDays(30)->toDateString())
        ->json('data');

    expect($all)->toHaveCount(2);
});

it('returns the shape the audit screen renders', function () {
    app(AuditLogger::class)
        ->log('jobs', 'created', 'Created a job', actor: $this->admin);

    $row = actingAs($this->admin)->getJson('/api/v1/admin/audit-logs')->json('data.0');

    expect($row)->toHaveKeys([
        'id', 'date', 'time', 'user', 'role', 'action',
        'module', 'description', 'ip', 'status',
    ]);
});

it('offers distinct values for the filter dropdowns', function () {
    $logger = app(AuditLogger::class);
    $logger->log('jobs', 'created', 'One', actor: $this->admin);
    $logger->log('users', 'deleted', 'Two', actor: $this->admin);

    $filters = actingAs($this->admin)->getJson('/api/v1/admin/audit-logs/filters')->json('data');

    expect($filters['modules'])->toContain('jobs', 'users')
        ->and($filters['actions'])->toContain('created', 'deleted');
});

it('preserves the actor name after the user is deleted', function () {
    $target = User::factory()->role('employer')->create(['first_name' => 'Gone', 'last_name' => 'User']);

    app(AuditLogger::class)
        ->log('jobs', 'created', 'Posted a job', actor: $target);

    $target->forceDelete();

    $row = actingAs($this->admin)->getJson('/api/v1/admin/audit-logs')->json('data.0');

    // An audit trail that loses its actor when the account goes is not a
    // usable audit trail.
    expect($row['user'])->toBe('Gone User')
        ->and($row['role'])->toBe('employer');
});

it('exports the audit log as csv', function () {
    app(AuditLogger::class)
        ->log('jobs', 'created', 'Exported entry', actor: $this->admin);

    $response = actingAs($this->admin)->get('/api/v1/admin/audit-logs/export')->assertOk();

    expect($response->streamedContent())
        ->toContain('Description')
        ->toContain('Exported entry');
});

it('reports audit stats including failed logins this week', function () {
    postJson('/api/v1/auth/login', [
        'email' => $this->admin->email, 'password' => 'wrong',
    ]);

    $stats = actingAs($this->admin)->getJson('/api/v1/admin/audit-logs/stats')->json('data');

    expect($stats)->toHaveKeys(['total', 'today', 'failed', 'by_module', 'failed_logins_week'])
        ->and($stats['failed_logins_week'])->toBeGreaterThan(0);
});
