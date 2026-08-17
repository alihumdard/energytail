<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->role('administrator')->create();
    $this->employer = User::factory()->role('employer')->create();
});

// ------------------------------------------------------------------ access

it('refuses the roles api to guests', function () {
    getJson('/api/v1/admin/roles')->assertUnauthorized();
});

it('refuses the roles api to users without the permission', function () {
    actingAs($this->employer)
        ->getJson('/api/v1/admin/roles')
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden');
});

it('blocks a suspended administrator on every request, not just at login', function () {
    $this->admin->update(['status' => 'suspended']);

    actingAs($this->admin)
        ->getJson('/api/v1/admin/roles')
        ->assertForbidden()
        ->assertJsonPath('code', 'account_suspended');
});

// -------------------------------------------------------------------- read

it('lists roles with user and permission counts', function () {
    $response = actingAs($this->admin)
        ->getJson('/api/v1/admin/roles')
        ->assertOk();

    expect($response->json('data'))->toHaveCount(5);

    $administrator = collect($response->json('data'))
        ->firstWhere('name', 'administrator');

    expect($administrator['is_system'])->toBeTrue()
        ->and($administrator['users_count'])->toBe(1)
        ->and($administrator['permissions_count'])->toBeGreaterThan(0);
});

it('returns a role with its permission names', function () {
    $employerRole = Role::where('name', 'employer')->first();

    actingAs($this->admin)
        ->getJson("/api/v1/admin/roles/{$employerRole->id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'employer')
        ->assertJsonFragment(['jobs.add']);
});

it('describes the matrix with unavailable cells marked', function () {
    $data = actingAs($this->admin)
        ->getJson('/api/v1/admin/roles/matrix')
        ->assertOk()
        ->json('data');

    expect($data['actions'])->toHaveCount(7)
        ->and($data['modules'])->toHaveCount(10);

    $auditLogs = collect($data['modules'])->firstWhere('key', 'audit_logs');

    // Audit logs can be viewed and exported but never edited, so those cells
    // render as "—" rather than as unchecked boxes.
    expect($auditLogs['actions']['view']['available'])->toBeTrue()
        ->and($auditLogs['actions']['view']['permission'])->toBe('audit_logs.view')
        ->and($auditLogs['actions']['delete']['available'])->toBeFalse()
        ->and($auditLogs['actions']['delete']['permission'])->toBeNull();
});

it('groups permissions by module', function () {
    $data = actingAs($this->admin)
        ->getJson('/api/v1/admin/permissions')
        ->assertOk()
        ->json('data');

    expect($data)->toHaveCount(10);

    $jobs = collect($data)->firstWhere('module', 'jobs');

    expect($jobs['label'])->toBe('Jobs')
        ->and(collect($jobs['permissions'])->pluck('name'))->toContain('jobs.approve');
});

it('lists the users holding a role', function () {
    $role = Role::where('name', 'employer')->first();

    actingAs($this->admin)
        ->getJson("/api/v1/admin/roles/{$role->id}/users")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.email', $this->employer->email);
});

// ------------------------------------------------------------------- write

it('creates a custom role and derives its machine key', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/roles', [
            'label' => 'Content Moderator',
            'description' => 'Moderates reader comments.',
            'permissions' => ['comments.view', 'comments.approve'],
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'content_moderator')
        ->assertJsonPath('data.label', 'Content Moderator')
        // Roles made in the admin panel stay deletable.
        ->assertJsonPath('data.is_system', false);

    $role = Role::where('name', 'content_moderator')->first();

    expect($role->hasPermissionTo('comments.approve'))->toBeTrue()
        ->and($role->hasPermissionTo('jobs.delete'))->toBeFalse();
});

it('rejects a role name that already exists', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/roles', ['label' => 'Employer'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('name');
});

it('rejects permissions that do not exist', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/roles', [
            'label' => 'Bogus Role',
            'permissions' => ['jobs.launch_rocket'],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('permissions.0');
});

it('saves the whole matrix in one request', function () {
    $role = Role::where('name', 'author')->first();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$role->id}/permissions", [
            'permissions' => ['articles.view', 'articles.add', 'articles.edit', 'comments.approve'],
        ])
        ->assertOk();

    $role->refresh();

    expect($role->permissions)->toHaveCount(4)
        ->and($role->hasPermissionTo('comments.approve'))->toBeTrue();
});

it('revokes every permission when sent an empty array', function () {
    $role = Role::where('name', 'author')->first();

    expect($role->permissions)->not->toBeEmpty();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$role->id}/permissions", ['permissions' => []])
        ->assertOk();

    expect($role->fresh()->permissions)->toBeEmpty();
});

it('requires the permissions key rather than treating it as optional', function () {
    $role = Role::where('name', 'author')->first();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$role->id}/permissions", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('permissions');
});

it('refuses to strip the administrator role of its permissions', function () {
    $admin = Role::where('name', 'administrator')->first();
    $before = $admin->permissions->count();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$admin->id}/permissions", ['permissions' => []])
        ->assertStatus(422)
        ->assertJsonValidationErrors('permissions');

    // Otherwise the platform would be left with nobody able to administer it.
    expect($admin->fresh()->permissions->count())->toBe($before);
});

it('updates a label without touching the machine key', function () {
    $role = Role::where('name', 'employer')->first();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$role->id}", [
            'label' => 'Hiring Manager',
        ])
        ->assertOk()
        ->assertJsonPath('data.label', 'Hiring Manager')
        // Permission checks reference the name, so it must never change.
        ->assertJsonPath('data.name', 'employer');
});

// ------------------------------------------------------------------ delete

it('refuses to delete a system role', function () {
    $role = Role::where('name', 'administrator')->first();

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/roles/{$role->id}")
        ->assertForbidden();

    expect(Role::where('name', 'administrator')->exists())->toBeTrue();
});

it('refuses to delete a role that still has users', function () {
    $role = Role::create([
        'name' => 'temp_role', 'label' => 'Temp', 'guard_name' => 'web', 'is_system' => false,
    ]);

    $this->employer->assignRole($role);

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/roles/{$role->id}")
        ->assertStatus(422)
        ->assertJsonValidationErrors('role');

    expect(Role::where('name', 'temp_role')->exists())->toBeTrue();
});

it('deletes an unused custom role', function () {
    $role = Role::create([
        'name' => 'temp_role', 'label' => 'Temp', 'guard_name' => 'web', 'is_system' => false,
    ]);

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/roles/{$role->id}")
        ->assertOk();

    expect(Role::where('name', 'temp_role')->exists())->toBeFalse();
});

// ------------------------------------------------------- permission effects

it('applies a permission change immediately rather than after a cache expiry', function () {
    $role = Role::where('name', 'employer')->first();

    expect($this->employer->fresh()->can('jobs.approve'))->toBeFalse();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/roles/{$role->id}/permissions", [
            'permissions' => ['jobs.view', 'jobs.approve'],
        ])->assertOk();

    // Spatie caches the permission map, so the service has to flush it on
    // every write or changes appear to do nothing.
    expect($this->employer->fresh()->can('jobs.approve'))->toBeTrue();
});
