<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Passes the request through unchanged.
 *
 * Used to switch off a middleware slot that only accepts a class name, such
 * as sanctum.middleware.encrypt_cookies — see the comment there.
 */
class NullMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}
