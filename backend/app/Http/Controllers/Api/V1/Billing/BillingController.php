<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Billing\StripeService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * An employer's own billing.
 *
 * Scoped to the company the caller acts for. The plan catalogue itself is
 * public — a pricing page has to be readable by someone deciding whether to
 * sign up — but everything that names a company is not.
 */
class BillingController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
        private readonly StripeService $stripe,
    ) {}

    /** The plan catalogue. Open to guests, for the pricing page. */
    public function plans(): JsonResponse
    {
        $plans = Plan::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $plans->map(fn (Plan $plan) => $this->transformPlan($plan))->all(),
        ]);
    }

    /** The caller's subscription, usage and invoices. */
    public function overview(Request $request): JsonResponse
    {
        $company = $request->user()?->primaryCompany();

        if ($company === null) {
            // Not an error: an employer without a company has nothing to bill.
            return response()->json([
                'data' => ['company' => null, 'subscription' => null, 'payments' => []],
            ]);
        }

        $this->authorize('view', $company);

        $subscription = $this->subscriptions->current($company);

        $payments = Payment::query()
            ->where('company_id', $company->getKey())
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'company' => ['id' => $company->id, 'name' => $company->name],
                'subscription' => $subscription === null
                    ? null
                    : $this->transformSubscription($subscription),
                'payments' => $payments->map(fn (Payment $p) => [
                    'id' => $p->id,
                    'amount_cents' => $p->amount_cents,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'failure_reason' => $p->failure_reason,
                    'invoice_url' => $p->invoice_url,
                    'invoice_pdf_url' => $p->invoice_pdf_url,
                    'paid_at' => $p->paid_at?->toIso8601String(),
                    'created_at' => $p->created_at?->toIso8601String(),
                ])->all(),
                // Whether payments can be taken at all, so the UI can explain
                // itself rather than offering a button that throws.
                'stripe_ready' => $this->stripe->isConfigured(),
            ],
        ]);
    }

    /**
     * Starts a checkout for the chosen plan.
     *
     * A free plan is assigned directly — sending someone to Stripe to pay
     * nothing would fail there rather than here.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $company = $request->user()?->primaryCompany();

        if ($company === null) {
            throw ValidationException::withMessages([
                'plan' => ['Set up your company profile before choosing a plan.'],
            ]);
        }

        $this->authorize('update', $company);

        $plan = Plan::query()->active()->where('slug', $validated['plan'])->firstOrFail();

        $existing = $this->subscriptions->current($company);

        if ($existing?->isValid() === true && $existing->plan_id === $plan->getKey()) {
            throw ValidationException::withMessages([
                'plan' => ['You are already on this plan.'],
            ]);
        }

        if ($plan->isFree()) {
            $subscription = $this->subscriptions->assignFreePlan(
                $company,
                $plan,
                $request->user()->getKey(),
            );

            return response()->json([
                'message' => "You are on the {$plan->name} plan.",
                'data' => ['checkout_url' => null, 'subscription' => $this->transformSubscription($subscription->load('plan'))],
            ]);
        }

        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        try {
            $url = $this->stripe->createCheckoutSession(
                $company,
                $plan,
                "{$frontend}/employer/billing?checkout=success",
                "{$frontend}/employer/billing?checkout=cancelled",
            );
        } catch (RuntimeException $e) {
            // Surfaced as a validation error so the employer sees why nothing
            // happened, instead of a 500 with no explanation.
            throw ValidationException::withMessages(['plan' => [$e->getMessage()]]);
        }

        return response()->json([
            'message' => 'Redirecting to checkout.',
            'data' => ['checkout_url' => $url],
        ]);
    }

    /**
     * Cancels at the end of the paid period.
     *
     * Not immediately: the employer paid for the period and their listings
     * stay live until it ends.
     */
    public function cancel(Request $request): JsonResponse
    {
        $company = $request->user()?->primaryCompany();

        if ($company === null) {
            throw ValidationException::withMessages([
                'subscription' => ['There is nothing to cancel.'],
            ]);
        }

        $this->authorize('update', $company);

        $subscription = $this->subscriptions->current($company);

        if ($subscription === null || ! $subscription->isValid()) {
            throw ValidationException::withMessages([
                'subscription' => ['You do not have an active subscription.'],
            ]);
        }

        if (filled($subscription->stripe_subscription_id)) {
            try {
                $this->stripe->cancelSubscription($subscription->stripe_subscription_id);
            } catch (RuntimeException $e) {
                throw ValidationException::withMessages(['subscription' => [$e->getMessage()]]);
            }
        }

        $subscription->update([
            'cancels_at' => $subscription->current_period_end ?? now(),
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'message' => 'Your subscription will end when the current period does.',
            'data' => $this->transformSubscription($subscription->fresh(['plan'])),
        ]);
    }

    /** @return array<string, mixed> */
    private function transformPlan(Plan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'description' => $plan->description,
            // Sent in cents as stored. Formatting is the frontend's job, and
            // a float here would reintroduce the rounding this avoids.
            'price_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'interval' => $plan->interval,
            'job_limit' => $plan->job_limit,
            'featured_job_limit' => $plan->featured_job_limit,
            'job_duration_days' => $plan->job_duration_days,
            'is_popular' => $plan->is_popular,
            'is_free' => $plan->isFree(),
        ];
    }

    /** @return array<string, mixed> */
    private function transformSubscription(Subscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'status' => $subscription->status,
            'is_valid' => $subscription->isValid(),
            'on_grace_period' => $subscription->onGracePeriod(),
            'current_period_start' => $subscription->current_period_start?->toIso8601String(),
            'current_period_end' => $subscription->current_period_end?->toIso8601String(),
            'cancels_at' => $subscription->cancels_at?->toIso8601String(),
            'jobs_used' => $subscription->jobs_used,
            'jobs_remaining' => $subscription->jobsRemaining(),
            'featured_used' => $subscription->featured_used,
            'featured_remaining' => $subscription->featuredRemaining(),
            'plan' => $subscription->relationLoaded('plan') && $subscription->plan
                ? $this->transformPlan($subscription->plan)
                : null,
        ];
    }
}
