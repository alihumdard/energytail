<?php

use App\Models\Activity;
use App\Models\User;
use App\Services\Admin\UserService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->role('administrator')->create();
    $this->employer = User::factory()->role('employer')->create();
});

// ------------------------------------------------------------------ access

it('refuses the users api to guests', function () {
    getJson('/api/v1/admin/users')->assertUnauthorized();
});

it('refuses the users api without the permission', function () {
    actingAs($this->employer)->getJson('/api/v1/admin/users')->assertForbidden();
});

// -------------------------------------------------------------------- read

it('lists users with their roles', function () {
    $response = actingAs($this->admin)->getJson('/api/v1/admin/users')->assertOk();

    expect($response->json('meta.total'))->toBe(2)
        ->and($response->json('data.0.roles'))->not->toBeEmpty();
});

it('filters by role, status and verification', function () {
    User::factory()->role('job_seeker')->count(3)->create();
    User::factory()->role('job_seeker')->unverified()->create();
    User::factory()->role('job_seeker')->suspended()->create();

    expect(actingAs($this->admin)->getJson('/api/v1/admin/users?role=job_seeker')->json('meta.total'))->toBe(5)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/users?status=suspended')->json('meta.total'))->toBe(1)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/users?verified=0')->json('meta.total'))->toBe(1);
});

it('searches by name and email', function () {
    User::factory()->role('job_seeker')->create([
        'first_name' => 'Zainab', 'last_name' => 'Iqbal',
        'name' => 'Zainab Iqbal', 'email' => 'zainab@example.com',
    ]);

    expect(actingAs($this->admin)->getJson('/api/v1/admin/users?search=Zainab')->json('meta.total'))->toBe(1)
        ->and(actingAs($this->admin)->getJson('/api/v1/admin/users?search=zainab@example')->json('meta.total'))->toBe(1);
});

it('reports stats broken down by role', function () {
    User::factory()->role('job_seeker')->count(4)->create();

    $stats = actingAs($this->admin)->getJson('/api/v1/admin/users/stats')->assertOk()->json('data');

    expect($stats['total'])->toBe(6)
        ->and($stats['active'])->toBe(6)
        ->and($stats)->toHaveKeys(['suspended', 'unverified', 'by_role', 'recent_signups']);
});

// ------------------------------------------------------------------- write

it('creates a user with any role, including administrator', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', [
            'first_name' => 'New',
            'last_name' => 'Admin',
            'email' => 'newadmin@example.com',
            'role' => 'administrator',
            'password' => 'Str0ng!Passw0rd',
        ])
        ->assertCreated()
        ->assertJsonPath('data.roles.0', 'administrator')
        // Unlike public registration, an admin vouching for the address is
        // treated as verification.
        ->assertJsonPath('data.email_verified', true);
});

it('creates a user without a password and sends them a reset link', function () {
    Notification::fake();

    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', [
            'first_name' => 'No', 'last_name' => 'Password',
            'email' => 'nopass@example.com', 'role' => 'job_seeker',
        ])
        ->assertCreated();

    $user = User::where('email', 'nopass@example.com')->first();

    actingAs($this->admin)
        ->postJson("/api/v1/admin/users/{$user->id}/password-reset")
        ->assertOk();
});

it('rejects a duplicate email', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', [
            'first_name' => 'Dup', 'last_name' => 'User',
            'email' => $this->employer->email, 'role' => 'job_seeker',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('rejects a role that does not exist', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', [
            'first_name' => 'Bad', 'last_name' => 'Role',
            'email' => 'badrole@example.com', 'role' => 'wizard',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('role');
});

it('changes a role', function () {
    actingAs($this->admin)
        ->putJson("/api/v1/admin/users/{$this->employer->id}", ['role' => 'author'])
        ->assertOk()
        ->assertJsonPath('data.roles.0', 'author');

    expect($this->employer->fresh()->hasRole('employer'))->toBeFalse();
});

it('unverifies an email when the address changes', function () {
    expect($this->employer->email_verified_at)->not->toBeNull();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/users/{$this->employer->id}", ['email' => 'changed@example.com'])
        ->assertOk()
        // The new mailbox has not been proven to belong to this user.
        ->assertJsonPath('data.email_verified', false);
});

// ------------------------------------------------------------- suspensions

it('suspends a user and ends their sessions', function () {
    $this->employer->createToken('test');

    expect($this->employer->tokens()->count())->toBe(1);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/users/{$this->employer->id}/status", [
            'status' => 'suspended',
            'reason' => 'Spam job postings.',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended');

    // A suspension that leaves live sessions working is not a suspension.
    expect($this->employer->fresh()->tokens()->count())->toBe(0)
        ->and($this->employer->fresh()->suspended_reason)->toBe('Spam job postings.');
});

it('reactivates a suspended user', function () {
    $this->employer->update(['status' => 'suspended', 'suspended_at' => now()]);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/users/{$this->employer->id}/status", ['status' => 'active'])
        ->assertOk()
        ->assertJsonPath('data.status', 'active');

    expect($this->employer->fresh()->suspended_at)->toBeNull();
});

it('refuses to suspend your own account', function () {
    actingAs($this->admin)
        ->patchJson("/api/v1/admin/users/{$this->admin->id}/status", ['status' => 'suspended'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('user');

    expect($this->admin->fresh()->status)->toBe('active');
});

it('allows suspending an administrator while another remains active', function () {
    $second = User::factory()->role('administrator')->create();

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/users/{$second->id}/status", ['status' => 'suspended'])
        ->assertOk()
        ->assertJsonPath('data.status', 'suspended');
});

// ------------------------------------------------------------------ delete

it('refuses to delete your own account', function () {
    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/users/{$this->admin->id}")
        ->assertForbidden();

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('allows deleting an administrator while another remains active', function () {
    $second = User::factory()->role('administrator')->create();

    actingAs($second)
        ->deleteJson("/api/v1/admin/users/{$this->admin->id}")
        ->assertOk();
});

it('refuses to delete the last active administrator', function () {
    // Exercised against the service directly. Going through the HTTP route
    // would need a second administrator to make the request, which by
    // definition means the target is no longer the last one.
    $service = app(UserService::class);
    $actor = User::factory()->role('employer')->create();

    expect(fn () => $service->delete($this->admin, $actor))
        ->toThrow(ValidationException::class);

    expect(User::find($this->admin->id))->not->toBeNull();
});

it('refuses to suspend the last active administrator', function () {
    $service = app(UserService::class);
    $actor = User::factory()->role('employer')->create();

    expect(fn () => $service->suspend($this->admin, 'testing', $actor))
        ->toThrow(ValidationException::class);

    expect($this->admin->fresh()->status)->toBe('active');
});

it('soft deletes so audit history survives', function () {
    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/users/{$this->employer->id}")
        ->assertOk();

    expect(User::find($this->employer->id))->toBeNull()
        // Audit rows and authored content still reference this user.
        ->and(User::withTrashed()->find($this->employer->id))->not->toBeNull();
});

// ------------------------------------------------------------------- audit

it('records user administration in the audit log', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/users', [
            'first_name' => 'Audited', 'last_name' => 'User',
            'email' => 'audited@example.com', 'role' => 'job_seeker',
        ])
        ->assertCreated();

    $entry = Activity::where('module', 'users')->where('action', 'created')->latest()->first();

    expect($entry)->not->toBeNull()
        ->and($entry->actor_name)->toBe($this->admin->full_name)
        ->and($entry->actor_role)->toBe('administrator')
        ->and($entry->description)->toContain('audited@example.com');
});

// ------------------------------------------------------------------ export

it('exports users as csv', function () {
    $response = actingAs($this->admin)->get('/api/v1/admin/users/export')->assertOk();

    expect($response->streamedContent())
        ->toContain('Email')
        ->toContain($this->employer->email);
});

it('never exposes password hashes', function () {
    $json = actingAs($this->admin)->getJson('/api/v1/admin/users')->content();

    expect($json)->not->toContain('$2y$');
});

/*
 * Regression: the list sorted by created_at with no tiebreaker. The seeded
 * users share a created_at to the second, and Postgres gives no order at all
 * among rows that compare equal — it returns them in heap order, which an
 * UPDATE changes, because the new row version is written at the end.
 *
 * Editing one user therefore reshuffled the whole page: the edited row moved,
 * someone else took its place, and it read as though the wrong record had
 * been changed.
 */
it('keeps the list in the same order after an edit', function () {
    $shared = now()->subDay();

    // Same timestamp on every row, as the seeder produces.
    User::factory()->count(8)->role('job_seeker')->create(['created_at' => $shared]);

    $before = actingAs($this->admin)
        ->getJson('/api/v1/admin/users?per_page=10')
        ->json('data.*.id');

    $target = $before[2];

    actingAs($this->admin)
        ->putJson("/api/v1/admin/users/{$target}", ['first_name' => 'Renamed'])
        ->assertOk();

    $after = actingAs($this->admin)
        ->getJson('/api/v1/admin/users?per_page=10')
        ->json('data.*.id');

    expect($after)->toBe($before);
});

it('never repeats a user across pages', function () {
    $shared = now()->subDay();

    User::factory()->count(12)->role('job_seeker')->create(['created_at' => $shared]);

    $first = actingAs($this->admin)->getJson('/api/v1/admin/users?per_page=5&page=1')->json('data.*.id');
    $second = actingAs($this->admin)->getJson('/api/v1/admin/users?per_page=5&page=2')->json('data.*.id');
    $third = actingAs($this->admin)->getJson('/api/v1/admin/users?per_page=5&page=3')->json('data.*.id');

    $seen = array_merge($first, $second, $third);

    // An unstable sort shows some users twice and hides others entirely.
    expect($seen)->toHaveCount(count(array_unique($seen)));
});
