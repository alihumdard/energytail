<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Builds the permission matrix from config/authorization.php.
 *
 * Idempotent: safe to re-run after adding a module to the config, which is
 * how new permissions reach an existing environment.
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->seedPermissions();
        $this->seedRoles();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function seedPermissions(): void
    {
        $actions = config('authorization.actions');

        foreach (config('authorization.modules') as $module => $definition) {
            foreach ($definition['actions'] as $action) {
                Permission::updateOrCreate(
                    ['name' => "{$module}.{$action}", 'guard_name' => 'web'],
                    [
                        'module' => $module,
                        'action' => $action,
                        'label' => $actions[$action] ?? $action,
                    ]
                );
            }
        }
    }

    private function seedRoles(): void
    {
        $sortOrder = 0;

        foreach (config('authorization.roles') as $name => $definition) {
            $role = Role::updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                [
                    'label' => $definition['label'],
                    'description' => $definition['description'],
                    'is_system' => true,
                    'sort_order' => $sortOrder++,
                ]
            );

            // '*' means every permission, including ones added to the config
            // later — so a new module does not silently lock out the admin.
            $permissions = $definition['permissions'] === '*'
                ? Permission::pluck('name')->all()
                : $definition['permissions'];

            $role->syncPermissions($permissions);
        }
    }
}
