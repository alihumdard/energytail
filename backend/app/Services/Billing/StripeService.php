<?php

declare(strict_types=1);

namespace App\Services\Billing;

use App\Models\Company;
use App\Models\Plan;
use RuntimeException;

/**
 * Talks to Stripe.
 *
 * Every call is funnelled through here so the rest of the application never
 * touches the SDK directly — which is what makes it possible to ship the
 * schema, the plans and the whole billing UI before the Stripe account
 * exists, and to test everything around it.
 *
 * The SDK is not installed yet. Until it is, and until keys are configured,
 * these methods refuse clearly rather than half-working: a checkout that
 * silently does nothing is worse than one that says it is not configured.
 */
class StripeService
{
    /** Whether Stripe is configured well enough to charge anybody. */
    public function isConfigured(): bool
    {
        return filled(config('services.stripe.secret'))
            && filled(config('services.stripe.key'));
    }

    /** Whether webhooks can be verified. Without this they must be refused. */
    public function hasWebhookSecret(): bool
    {
        return filled(config('services.stripe.webhook_secret'));
    }

    /**
     * Creates a Checkout session and returns the URL to send the employer to.
     *
     * @return string The hosted Checkout URL
     *
     * @throws RuntimeException when Stripe is not configured
     */
    public function createCheckoutSession(Company $company, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        $this->ensureConfigured();

        if (blank($plan->stripe_price_id)) {
            throw new RuntimeException(
                "Plan \"{$plan->name}\" has no Stripe price id. Create the price in Stripe and store its id on the plan.",
            );
        }

        /*
         * Deliberately not implemented until the SDK is installed.
         *
         * The signature, the arguments and the call sites are settled, so
         * adding stripe/stripe-php and filling this in is a contained change
         * rather than a redesign.
         */
        throw new RuntimeException(
            'Stripe checkout is not wired up yet. Install stripe/stripe-php and complete StripeService::createCheckoutSession().',
        );
    }

    /**
     * Verifies a webhook signature and returns the decoded event.
     *
     * @return array<string, mixed>
     *
     * @throws RuntimeException when the secret is missing or the signature fails
     */
    public function constructWebhookEvent(string $payload, string $signature): array
    {
        if (! $this->hasWebhookSecret()) {
            /*
             * Refused rather than trusted.
             *
             * An unverified webhook is an unauthenticated request that can
             * mark any subscription paid — accepting one because the secret
             * happens to be unset would be the whole billing system's soft
             * underbelly.
             */
            throw new RuntimeException('STRIPE_WEBHOOK_SECRET is not set; webhooks cannot be verified.');
        }

        throw new RuntimeException(
            'Stripe webhook verification is not wired up yet. Install stripe/stripe-php and complete StripeService::constructWebhookEvent().',
        );
    }

    /** Cancels at period end, so the employer keeps what they paid for. */
    public function cancelSubscription(string $stripeSubscriptionId): void
    {
        $this->ensureConfigured();

        throw new RuntimeException(
            'Stripe cancellation is not wired up yet. Install stripe/stripe-php and complete StripeService::cancelSubscription().',
        );
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException(
                'Stripe is not configured. Set STRIPE_KEY and STRIPE_SECRET in your environment.',
            );
        }
    }
}
