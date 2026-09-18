<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Job;
use App\Models\User;

/**
 * Who may act on a job listing.
 *
 * Permissions say what a role can do; this says what it can do it to. An
 * employer holds jobs.edit, but that must never mean editing a competitor's
 * listing — the company the job belongs to is the boundary.
 */
class JobPolicy
{
    /**
     * Administrators bypass every check below.
     *
     * Returning null rather than false lets the individual methods decide;
     * true here would short-circuit them all.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('administrator') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('jobs.view');
    }

    public function view(User $user, Job $job): bool
    {
        return $user->can('jobs.view') && $this->ownsJob($user, $job);
    }

    public function create(User $user): bool
    {
        // A company to post under is as necessary as the permission itself.
        return $user->can('jobs.add') && $user->primaryCompany() !== null;
    }

    public function update(User $user, Job $job): bool
    {
        return $user->can('jobs.edit') && $this->ownsJob($user, $job);
    }

    public function delete(User $user, Job $job): bool
    {
        return $user->can('jobs.delete') && $this->ownsJob($user, $job);
    }

    /**
     * Approving is a moderator's act, never the poster's.
     *
     * Ownership is deliberately not consulted: letting an employer approve
     * their own listing would make the review gate decorative.
     */
    public function approve(User $user): bool
    {
        return $user->can('jobs.approve');
    }

    private function ownsJob(User $user, Job $job): bool
    {
        return $job->company !== null && $user->actsFor($job->company);
    }
}
