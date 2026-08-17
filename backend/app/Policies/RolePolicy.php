<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('roles.view');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('roles.view');
    }

    public function create(User $user): bool
    {
        return $user->can('roles.add');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can('roles.edit');
    }

    /**
     * System roles are never deletable, whatever permissions the caller holds.
     * The service repeats this check, since a role can also be deleted from a
     * console command that never passes through a policy.
     */
    public function delete(User $user, Role $role): bool
    {
        return $user->can('roles.edit') && ! $role->isSystem();
    }
}
