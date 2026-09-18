<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

/**
 * Who may act on a company profile.
 *
 * The same boundary as JobPolicy: holding companies.edit lets an employer
 * edit their own company, not anyone else's.
 */
class CompanyPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('administrator') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('companies.view');
    }

    public function view(User $user, Company $company): bool
    {
        return $user->can('companies.view') && $user->actsFor($company);
    }

    /** Setting up your own company profile for the first time. */
    public function create(User $user): bool
    {
        return $user->can('companies.add');
    }

    public function update(User $user, Company $company): bool
    {
        return $user->can('companies.edit') && $user->actsFor($company);
    }

    /**
     * Deleting a company is an administrator's act.
     *
     * before() has already let them through, so this is false for everyone
     * else: an employer removing their own company would orphan every job
     * posted under it and break the public URLs those jobs are indexed at.
     */
    public function delete(User $user, Company $company): bool
    {
        return false;
    }

    public function approve(User $user): bool
    {
        return $user->can('companies.approve');
    }
}
