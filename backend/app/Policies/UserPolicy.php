<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->can('users.view');
    }

    public function create(User $user): bool
    {
        return $user->can('users.add');
    }

    public function update(User $user, User $target): bool
    {
        return $user->can('users.edit');
    }

    /**
     * Nobody may delete their own account through the admin panel, whatever
     * permissions they hold — that is an accident waiting to happen, and the
     * service repeats the check for callers that bypass policies.
     */
    public function delete(User $user, User $target): bool
    {
        return $user->can('users.delete') && ! $user->is($target);
    }

    public function export(User $user): bool
    {
        return $user->can('users.export');
    }
}
