<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

/**
 * What a company is entitled to, and the accounting behind it.
 *
 * Kept out of the controllers because the same questions are asked from
 * several places — posting a job, the billing page, the admin view — and an
 * entitlement rule that differs between them is a rule that will be wrong
 * somewhere.
 */
class SubscriptionService
{
    /** The company's current subscription, valid or not. */
    public function current(Company $company): ?Subscription
    {
        return Subscription::query()
            ->where('company_id', $company->getKey())
            ->with('plan')
            ->latest('id')
            ->first();
    }

    /** The company's subscription, only if it currently entitles them. */
    public function active(Company $company): ?Subscription
    {
        $subscription = $this->current($company);

        return $subscription?->isValid() === true ? $subscription : null;
    }

    /**
     * Whether the company may post another job right now.
     *
     * A company with no subscription at all can still post: billing is being
     * introduced to a board that already has employers on it, and cutting
     * them off the day this ships would be a change nobody agreed to. The
     * gate applies once a plan has been chosen.
     */
    public function canPostJob(Company $company): bool
    {
        $subscription = $this->current($company);

        if ($subscription === null) {
            return true;
        }

        return $subscription->canPostJob();
    }

    /** Why posting was refused, for a message the employer can act on. */
    public function postingBlockedReason(Company $company): ?string
    {
        $subscription = $this->current($company);

        if ($subscription === null) {
            return null;
        }

        if (! $subscription->isValid()) {
            return 'Your subscription is not active. Renew it to post jobs.';
        }

        if (! $subscription->canPostJob()) {
            $limit = $subscription->plan?->job_limit;

            return "You have used all {$limit} job postings on your plan this period. Upgrade to post more.";
        }

        return null;
    }

    /**
     * Records that a posting was used.
     *
     * Counted on the subscription rather than by querying jobs: a listing
     * deleted after posting still consumed its slot, and counting live rows
     * would hand the allowance back.
     */
    public function recordJobPosted(Company $company, bool $featured = false): void
    {
        $subscription = $this->current($company);

        if ($subscription === null) {
            return;
        }

        // Incremented in the database rather than read-modify-write, so two
        // simultaneous postings cannot both read the same starting count.
        DB::transaction(function () use ($subscription, $featured) {
            $subscription->increment('jobs_used');

            if ($featured) {
                $subscription->increment('featured_used');
            }
        });
    }

    /**
     * Starts a new billing period.
     *
     * Called from the invoice.paid webhook. The used counters reset here and
     * nowhere else — a period that rolls over without payment should not
     * hand out a fresh allowance.
     */
    public function startNewPeriod(
        Subscription $subscription,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
    ): void {
        $subscription->update([
            'current_period_start' => $start,
            'current_period_end' => $end,
            'jobs_used' => 0,
            'featured_used' => 0,
            'status' => Subscription::STATUS_ACTIVE,
        ]);
    }

    /**
     * Puts a company on a plan without going through Stripe.
     *
     * For free tiers and for an administrator granting a plan by hand. A paid
     * plan still needs Stripe to collect the money, so this refuses one.
     */
    public function assignFreePlan(Company $company, Plan $plan, ?int $actorId = null): Subscription
    {
        if (! $plan->isFree()) {
            throw new \InvalidArgumentException(
                'A paid plan must be started through Stripe so the payment is collected.',
            );
        }

        return Subscription::query()->create([
            'company_id' => $company->getKey(),
            'plan_id' => $plan->getKey(),
            'created_by' => $actorId,
            'status' => Subscription::STATUS_ACTIVE,
            'current_period_start' => now(),
            'current_period_end' => $plan->interval === 'year'
                ? now()->addYear()
                : now()->addMonth(),
        ]);
    }
}
