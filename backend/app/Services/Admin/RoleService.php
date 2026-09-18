<?php

namespace App\Services\Admin;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    /**
     * Roles the platform depends on. Administrator is the critical one:
     * deleting it or stripping its permissions would leave nobody able to
     * administer the site.
     */
    private const PROTECTED_NAMES = ['administrator'];

    /**
     * Builds the matrix the admin screen renders: modules as rows, actions as
     * columns, with cells marked unavailable where an action does not apply.
     *
     * Driven by config/authorization.php so the UI and the seeded permissions
     * cannot drift apart.
     *
     * @return array<string, mixed>
     */
    public function matrix(): array
    {
        $actions = config('authorization.actions');
        $modules = [];

        foreach (config('authorization.modules') as $key => $definition) {
            $cells = [];

            foreach (array_keys($actions) as $action) {
                $supported = in_array($action, $definition['actions'], true);

                $cells[$action] = [
                    // false renders as an unchecked box; null renders as "—",
                    // meaning the action makes no sense for this module.
                    'available' => $supported,
                    'permission' => $supported ? "{$key}.{$action}" : null,
                ];
            }

            $modules[] = [
                'key' => $key,
                'label' => $definition['label'],
                'description' => $definition['description'],
                'actions' => $cells,
            ];
        }

        return [
            'actions' => collect($actions)->map(fn ($desc, $key) => [
                'key' => $key,
                'label' => ucfirst($key),
                'description' => $desc,
            ])->values()->all(),
            'modules' => $modules,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            /** @var Role $role */
            $role = Role::query()->create([
                'name' => $data['name'],
                'label' => $data['label'],
                'description' => $data['description'] ?? null,
                'guard_name' => 'web',
                // Roles created through the admin panel are never system
                // roles, so they stay deletable.
                'is_system' => false,
                'sort_order' => (int) Role::max('sort_order') + 1,
            ]);

            if (! empty($data['permissions'])) {
                $role->syncPermissions($data['permissions']);
            }

            $this->flushCache();

            return $role;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): Role
    {
        /*
         * System roles keep the labels they were seeded with.
         *
         * The label is how a role is identified everywhere in the UI, and
         * nothing stops it being set to another role's name: renaming
         * Administrator to "Employer" left a list with two entries that read
         * the same and no way to tell which one granted full access. Their
         * descriptions stay editable, which is the part that carries no risk.
         */
        if ($role->is_system && isset($data['label']) && $data['label'] !== $role->label) {
            throw ValidationException::withMessages([
                'label' => ['System roles cannot be renamed.'],
            ]);
        }

        $role->update(array_filter([
            'label' => $data['label'] ?? null,
            'description' => $data['description'] ?? null,
            'sort_order' => $data['sort_order'] ?? null,
        ], fn ($value) => $value !== null));

        $this->flushCache();

        return $role->fresh();
    }

    /**
     * Replaces a role's permissions wholesale.
     *
     * @param  array<int, string>  $permissions
     *
     * @throws ValidationException
     */
    public function syncPermissions(Role $role, array $permissions): Role
    {
        if (in_array($role->name, self::PROTECTED_NAMES, true)) {
            throw ValidationException::withMessages([
                'permissions' => [
                    "The {$role->label} role must keep full access and cannot be edited.",
                ],
            ]);
        }

        DB::transaction(function () use ($role, $permissions) {
            $role->syncPermissions($permissions);
        });

        $this->flushCache();

        return $role->load('permissions');
    }

    /**
     * @throws ValidationException
     */
    public function delete(Role $role): void
    {
        if ($role->isSystem()) {
            throw ValidationException::withMessages([
                'role' => ['System roles cannot be deleted.'],
            ]);
        }

        if ($role->users()->exists()) {
            $count = $role->users()->count();

            throw ValidationException::withMessages([
                'role' => [
                    "This role is assigned to {$count} user(s). Reassign them before deleting it.",
                ],
            ]);
        }

        $role->delete();
        $this->flushCache();
    }

    /**
     * Grants every permission to the administrator role.
     *
     * Called after new permissions are introduced, so adding a module never
     * silently locks administrators out of it.
     */
    public function refreshAdministrator(): void
    {
        $admin = Role::where('name', 'administrator')->first();

        $admin?->syncPermissions(Permission::pluck('name')->all());

        $this->flushCache();
    }

    /**
     * Spatie caches the permission map, so every write has to invalidate it —
     * otherwise a permission change appears to have no effect until the cache
     * expires.
     */
    private function flushCache(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
