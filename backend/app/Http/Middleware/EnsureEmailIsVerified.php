<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires a verified email before an action proceeds.
 *
 * Applied to publishing actions — posting a job, submitting an article — but
 * deliberately not to browsing or profile editing. The plan asks for
 * verification to gate publishing, and blocking read access would make the
 * product feel broken to a user who has not yet opened their inbox.
 *
 * Returns JSON rather than Laravel's default redirect, since every consumer
 * here is an API client.
 */
class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Verify your email address to continue.',
                'code' => 'email_not_verified',
            ], 403);
        }

        return $next($request);
    }
}
