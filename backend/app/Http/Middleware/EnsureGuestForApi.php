<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks already-authenticated callers from the sign-in and registration
 * endpoints, answering in JSON.
 *
 * Laravel's own 'guest' middleware redirects to a HTML page instead, which is
 * right for a server-rendered app and wrong here: the SPA parses every reply
 * as JSON, so a 302 carrying an HTML body surfaced as an unexplained failure
 * with no message for the user. Signing in while a session was already open —
 * an ordinary thing to do on a page left sitting in a tab — hit exactly that.
 */
class EnsureGuestForApi
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('web')->check()) {
            return new JsonResponse([
                'message' => 'You are already signed in.',
                'code' => 'already_authenticated',
            ], 409);
        }

        return $next($request);
    }
}
