<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Notifications\NewsletterConfirmation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Throwable;

/**
 * Newsletter signup, with confirmed opt-in.
 *
 * Double opt-in rather than a bare address capture: anyone can type someone
 * else's address into a public form, and a list built that way is the fastest
 * route to a blocked sending domain. Nothing is sent until the owner of the
 * address clicks the link.
 */
class NewsletterController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc,dns', 'max:255'],
            'name' => ['sometimes', 'nullable', 'string', 'max:120'],
        ], [
            'email.email' => 'Enter a real email address.',
        ]);

        $existing = NewsletterSubscriber::query()
            ->where('email', $validated['email'])
            ->first();

        /*
         * An already-confirmed address gets the same answer as a new one.
         *
         * Saying "you are already subscribed" would turn this public form
         * into a way to test whether a given person is on the list.
         */
        if ($existing?->status === NewsletterSubscriber::STATUS_CONFIRMED) {
            return response()->json([
                'message' => 'Check your inbox to confirm your subscription.',
            ]);
        }

        $token = Str::random(64);

        $subscriber = NewsletterSubscriber::query()->updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'] ?? $existing?->name,
                'user_id' => $request->user()?->getKey(),
                'status' => NewsletterSubscriber::STATUS_PENDING,
                'confirmation_token' => $token,
                'source' => 'website',
                'ip_address' => $request->ip(),
                'unsubscribed_at' => null,
            ],
        );

        try {
            Notification::route('mail', $subscriber->email)
                ->notify(new NewsletterConfirmation($subscriber->email, $token));
        } catch (Throwable $e) {
            // The row is already stored, so a mail failure must not lose the
            // signup or show the visitor an error for something they cannot fix.
            report($e);
        }

        return response()->json([
            'message' => 'Check your inbox to confirm your subscription.',
        ], 201);
    }

    /** Confirms a subscription from the emailed link. */
    public function confirm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        $subscriber = NewsletterSubscriber::query()
            ->where('confirmation_token', $validated['token'])
            ->first();

        if ($subscriber === null) {
            return response()->json([
                'message' => 'That confirmation link is not valid or has already been used.',
            ], 404);
        }

        $subscriber->update([
            'status' => NewsletterSubscriber::STATUS_CONFIRMED,
            'confirmed_at' => now(),
            // Single use: the token is what guards the link, so it is spent
            // once the address is confirmed.
            'confirmation_token' => null,
        ]);

        return response()->json(['message' => 'You are subscribed. Thanks for joining.']);
    }

    /**
     * Removes an address from the list.
     *
     * Keyed by email rather than a token, and deliberately answered the same
     * way whether or not the address was on the list: unsubscribing must be
     * easy, and confirming membership would leak it.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
        ]);

        NewsletterSubscriber::query()
            ->where('email', $validated['email'])
            ->update([
                'status' => NewsletterSubscriber::STATUS_UNSUBSCRIBED,
                'unsubscribed_at' => now(),
                'confirmation_token' => null,
            ]);

        return response()->json([
            'message' => 'That address will no longer receive the newsletter.',
        ]);
    }
}
