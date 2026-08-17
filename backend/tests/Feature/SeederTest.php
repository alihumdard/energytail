<?php

use App\Models\City;
use App\Models\Country;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxonomySeeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

it('builds every permission defined in the authorization config', function () {
    $this->seed(RolePermissionSeeder::class);

    $expected = collect(config('authorization.modules'))
        ->flatMap(fn (array $module, string $name) => collect($module['actions'])
            ->map(fn (string $action) => "{$name}.{$action}"))
        ->sort()
        ->values();

    expect(Permission::pluck('name')->sort()->values()->all())
        ->toBe($expected->all());
});

it('grants administrators every permission', function () {
    $this->seed(RolePermissionSeeder::class);

    $admin = Role::where('name', 'administrator')->first();

    expect($admin->permissions)->toHaveCount(Permission::count())
        ->and($admin->is_system)->toBeTrue();
});

it('restricts non-admin roles to their configured permissions', function () {
    $this->seed(RolePermissionSeeder::class);

    $employer = Role::where('name', 'employer')->first();

    expect($employer->hasPermissionTo('jobs.add'))->toBeTrue()
        ->and($employer->hasPermissionTo('jobs.approve'))->toBeFalse()
        ->and($employer->hasPermissionTo('users.delete'))->toBeFalse()
        ->and($employer->hasPermissionTo('settings.edit'))->toBeFalse();
});

it('marks all seeded roles as system roles so they cannot be deleted', function () {
    $this->seed(RolePermissionSeeder::class);

    expect(Role::where('is_system', false)->count())->toBe(0)
        ->and(Role::count())->toBe(count(config('authorization.roles')));
});

it('can be re-run without duplicating roles or permissions', function () {
    $this->seed(RolePermissionSeeder::class);
    $rolesAfterFirst = Role::count();
    $permsAfterFirst = Permission::count();

    $this->seed(RolePermissionSeeder::class);

    expect(Role::count())->toBe($rolesAfterFirst)
        ->and(Permission::count())->toBe($permsAfterFirst);
});

it('never overwrites a setting the client has already changed', function () {
    $this->seed(SettingSeeder::class);

    Setting::where('key', 'site_name')->update(['value' => 'Client Chosen Name']);

    $this->seed(SettingSeeder::class);

    expect(Setting::where('key', 'site_name')->value('value'))
        ->toBe('Client Chosen Name');
});

it('keeps credentials out of public settings', function () {
    $this->seed(SettingSeeder::class);

    $publicKeys = Setting::public()->pluck('key');

    expect($publicKeys)->not->toContain('recaptcha_secret_key')
        ->and($publicKeys)->toContain('site_name');
});

it('seeds every city against a real country', function () {
    $this->seed(TaxonomySeeder::class);

    $orphans = City::whereNotIn(
        'country_id', Country::pluck('id')
    )->count();

    expect($orphans)->toBe(0)
        ->and(Country::count())->toBeGreaterThan(10)
        ->and(City::count())->toBeGreaterThan(30);
});

it('assigns a role to the users the demo seeder creates', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->role('employer')->create();

    expect($user->hasRole('employer'))->toBeTrue()
        ->and($user->can('jobs.add'))->toBeTrue()
        ->and($user->can('users.delete'))->toBeFalse();
});
