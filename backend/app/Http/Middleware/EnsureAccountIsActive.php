<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks suspended accounts on every request, not only at sign-in.
 *
 * Without this an administrator could suspend somebody who is already signed
 * in and that session would keep working until it expired.
 */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isSuspended()) {
            return response()->json([
                'message' => 'This account has been suspended. Contact support for help.',
                'code' => 'account_suspended',
            ], 403);
        }

        return $next($request);
    }
}
