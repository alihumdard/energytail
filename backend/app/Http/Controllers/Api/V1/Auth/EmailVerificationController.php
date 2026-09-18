<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Throwable;

class EmailVerificationController extends Controller
{
    /**
     * Confirms an address from the signed link in the verification email.
     *
     * Deliberately unauthenticated: the link is often opened in a different
     * browser from the one that registered. Its signature and the hash below
     * are what make it safe.
     */
    public function verify(Request $request, int $id, string $hash): JsonResponse
    {
        if (! URL::hasValidSignature($request)) {
            return response()->json([
                'message' => 'This verification link is invalid or has expired.',
                'code' => 'invalid_signature',
            ], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'This verification link is invalid.',
                'code' => 'invalid_signature',
            ], 403);
        }

        // Ties the link to the address it was issued for, so changing the
        // email invalidates any verification link already sent.
        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'This verification link is invalid.',
                'code' => 'invalid_signature',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already verified.']);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        // Queued, and never allowed to fail the request: the address is
        // already confirmed by this point, so a mail problem must not read
        // back to the user as a failed verification.
        try {
            $user->notify(new WelcomeNotification);
        } catch (Throwable $e) {
            Log::error('Welcome email failed to send.', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'Email verified. You can now sign in.']);
    }

    /** Seconds a user must wait between verification emails. */
    private const RESEND_COOLDOWN = 60;

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already verified.']);
        }

        /*
         * Per-user cooldown, on top of the route throttle. The throttle is
         * keyed by IP, so it does nothing to stop one account being used to
         * post mail at an address repeatedly — which is what gets a sending
         * domain marked as spam.
         */
        $key = "verification-resend:{$user->id}";

        if (($seconds = Cache::get($key)) !== null) {
            $remaining = max(1, $seconds - time());

            return response()->json([
                'message' => "Please wait {$remaining} seconds before requesting another email.",
                'code' => 'resend_cooldown',
                'retry_after' => $remaining,
            ], 429);
        }

        $user->sendEmailVerificationNotification();

        Cache::put($key, time() + self::RESEND_COOLDOWN, self::RESEND_COOLDOWN);

        return response()->json([
            'message' => 'Verification email sent.',
            'retry_after' => self::RESEND_COOLDOWN,
        ]);
    }
}
