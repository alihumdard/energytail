<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\WebhookEvent;
use App\Services\Billing\StripeService;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Receives Stripe webhooks.
 *
 * Unauthenticated by necessity — Stripe has no session — so the signature is
 * the only thing standing between this endpoint and anyone who can POST to
 * it. An unverified payload is refused outright: accepting one would let a
 * stranger mark any subscription paid.
 *
 * Every event is recorded before it is handled. Stripe retries until it gets
 * a 2xx and can redeliver after success, so the unique event id is what stops
 * a repeated invoice.paid from extending a subscription twice.
 */
class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly StripeService $stripe,
        private readonly SubscriptionService $subscriptions,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $signature = $request->header('Stripe-Signature', '');

        try {
            $event = $this->stripe->constructWebhookEvent($request->getContent(), $signature);
        } catch (Throwable $e) {
            Log::warning('Rejected a Stripe webhook.', ['reason' => $e->getMessage()]);

            // 400, not 500: a bad signature is the caller's problem, and
            // Stripe should not retry something that will never verify.
            return response()->json(['message' => 'Signature verification failed.'], 400);
        }

        $eventId = (string) ($event['id'] ?? '');
        $type = (string) ($event['type'] ?? '');

        if ($eventId === '') {
            return response()->json(['message' => 'Malformed event.'], 400);
        }

        /*
         * firstOrCreate on the unique event id is the idempotency guard. A
         * redelivered event finds the existing row and, if it was already
         * processed, stops here.
         */
        $record = WebhookEvent::query()->firstOrCreate(
            ['event_id' => $eventId],
            ['provider' => 'stripe', 'type' => $type, 'payload' => $event],
        );

        if ($record->processed_at !== null) {
            return response()->json(['message' => 'Already processed.']);
        }

        try {
            $this->handle($type, $event);

            $record->update(['processed_at' => now(), 'error' => null]);
        } catch (Throwable $e) {
            $record->update(['error' => $e->getMessage()]);

            Log::error('Failed to handle a Stripe webhook.', [
                'event_id' => $eventId,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            // 500 so Stripe retries: the event was genuine and our handling
            // failed, which is exactly what retries are for.
            return response()->json(['message' => 'Handler failed.'], 500);
        }

        return response()->json(['message' => 'Handled.']);
    }

    /** @param  array<string, mixed>  $event */
    private function handle(string $type, array $event): void
    {
        $object = $event['data']['object'] ?? [];

        match ($type) {
            'checkout.session.completed' => $this->onCheckoutCompleted($object),
            'invoice.paid' => $this->onInvoicePaid($object),
            'invoice.payment_failed' => $this->onInvoiceFailed($object),
            'customer.subscription.updated' => $this->onSubscriptionUpdated($object),
            'customer.subscription.deleted' => $this->onSubscriptionDeleted($object),
            // Everything else is recorded and acknowledged. Stripe sends far
            // more than this handles, and 500-ing on an event we simply do
            // not care about would put it into a retry loop.
            default => null,
        };
    }

    /** @param  array<string, mixed>  $session */
    private function onCheckoutCompleted(array $session): void
    {
        $subscriptionId = $session['subscription'] ?? null;
        $companyId = $session['metadata']['company_id'] ?? null;
        $planId = $session['metadata']['plan_id'] ?? null;

        if (! $subscriptionId || ! $companyId || ! $planId) {
            return;
        }

        Subscription::query()->updateOrCreate(
            ['stripe_subscription_id' => $subscriptionId],
            [
                'company_id' => (int) $companyId,
                'plan_id' => (int) $planId,
                'stripe_customer_id' => $session['customer'] ?? null,
                'status' => Subscription::STATUS_ACTIVE,
                'current_period_start' => now(),
            ],
        );
    }

    /** @param  array<string, mixed>  $invoice */
    private function onInvoicePaid(array $invoice): void
    {
        $subscription = $this->findSubscription($invoice['subscription'] ?? null);

        if ($subscription === null) {
            return;
        }

        Payment::query()->updateOrCreate(
            ['stripe_invoice_id' => $invoice['id'] ?? null],
            [
                'company_id' => $subscription->company_id,
                'subscription_id' => $subscription->id,
                'stripe_payment_intent_id' => $invoice['payment_intent'] ?? null,
                'amount_cents' => (int) ($invoice['amount_paid'] ?? 0),
                'currency' => strtoupper((string) ($invoice['currency'] ?? 'usd')),
                'status' => Payment::STATUS_SUCCEEDED,
                'invoice_url' => $invoice['hosted_invoice_url'] ?? null,
                'invoice_pdf_url' => $invoice['invoice_pdf'] ?? null,
                'paid_at' => now(),
            ],
        );

        /*
         * The allowance resets here and nowhere else. A period that rolls
         * over without payment must not hand out a fresh set of postings.
         */
        $period = $invoice['lines']['data'][0]['period'] ?? null;

        if (is_array($period) && isset($period['start'], $period['end'])) {
            $this->subscriptions->startNewPeriod(
                $subscription,
                (new \DateTimeImmutable)->setTimestamp((int) $period['start']),
                (new \DateTimeImmutable)->setTimestamp((int) $period['end']),
            );
        }
    }

    /** @param  array<string, mixed>  $invoice */
    private function onInvoiceFailed(array $invoice): void
    {
        $subscription = $this->findSubscription($invoice['subscription'] ?? null);

        if ($subscription === null) {
            return;
        }

        Payment::query()->updateOrCreate(
            ['stripe_invoice_id' => $invoice['id'] ?? null],
            [
                'company_id' => $subscription->company_id,
                'subscription_id' => $subscription->id,
                'amount_cents' => (int) ($invoice['amount_due'] ?? 0),
                'currency' => strtoupper((string) ($invoice['currency'] ?? 'usd')),
                'status' => Payment::STATUS_FAILED,
                // Stripe's own wording, kept as-is: our paraphrase would only
                // obscure why the bank refused.
                'failure_reason' => $invoice['last_finalization_error']['message'] ?? 'The payment was declined.',
            ],
        );

        /*
         * past_due, not cancelled. Stripe keeps retrying a failed card for
         * days; taking the employer's listings down on the first failure
         * would punish them for a bank's temporary refusal.
         */
        $subscription->update(['status' => Subscription::STATUS_PAST_DUE]);
    }

    /** @param  array<string, mixed>  $object */
    private function onSubscriptionUpdated(array $object): void
    {
        $subscription = $this->findSubscription($object['id'] ?? null);

        if ($subscription === null) {
            return;
        }

        $subscription->update([
            'status' => (string) ($object['status'] ?? $subscription->status),
            'current_period_end' => isset($object['current_period_end'])
                ? (new \DateTimeImmutable)->setTimestamp((int) $object['current_period_end'])
                : $subscription->current_period_end,
            'cancels_at' => ($object['cancel_at_period_end'] ?? false) && isset($object['current_period_end'])
                ? (new \DateTimeImmutable)->setTimestamp((int) $object['current_period_end'])
                : null,
        ]);
    }

    /** @param  array<string, mixed>  $object */
    private function onSubscriptionDeleted(array $object): void
    {
        $this->findSubscription($object['id'] ?? null)?->update([
            'status' => Subscription::STATUS_CANCELED,
            'cancelled_at' => now(),
        ]);
    }

    private function findSubscription(mixed $stripeId): ?Subscription
    {
        if (! is_string($stripeId) || $stripeId === '') {
            return null;
        }

        return Subscription::query()
            ->where('stripe_subscription_id', $stripeId)
            ->with('plan')
            ->first();
    }
}
