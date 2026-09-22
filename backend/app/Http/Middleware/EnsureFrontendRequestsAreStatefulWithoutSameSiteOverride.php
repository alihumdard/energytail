<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

/**
 * Same as Sanctum's own middleware, minus its hardcoded same_site override.
 *
 * The parent's configureSecureCookieSessions() forces session.same_site to
 * 'lax' on every request, no matter what SESSION_SAME_SITE says. That is
 * wrong here: the frontend (energytail.com) calls the API on a different
 * subdomain (api.energytail.com), and a fetch() request — unlike the OAuth
 * redirect's top-level navigation — is a cross-site request under the
 * SameSite spec. A Lax session cookie is not sent on those at all, so the
 * backend silently sees a guest, starts a fresh session for the request,
 * and the CSRF token bound to it never matches the one already embedded in
 * the page — surfacing as "CSRF token mismatch" on API calls like this
 * one, seemingly at random.
 *
 * .env's SESSION_SAME_SITE=none is what these cross-subdomain requests
 * actually need, so this middleware just doesn't touch it.
 */
class EnsureFrontendRequestsAreStatefulWithoutSameSiteOverride extends EnsureFrontendRequestsAreStateful
{
    protected function configureSecureCookieSessions()
    {
        //
    }

    /**
     * Drops EncryptCookies and StartSession from the inner pipeline.
     *
     * Both already ran once, unconditionally, in bootstrap/app.php before
     * this middleware — that's what makes the OAuth callback and the CSRF
     * cookie work at all, since the request isn't always "from the
     * frontend" by Origin/Referer. Running them again here is not just
     * redundant: this inner StartSession's own response-side save/cookie
     * step runs after the outer EncryptCookies has already queued its
     * encrypted cookie, appending a second, unencrypted one that wins —
     * which is what a plain (non-JSON) session cookie in the response
     * meant, and why the browser and the next request disagreed on the
     * session's contents (CSRF token mismatch, seemingly at random).
     *
     * Only the CSRF and auth-session middleware in the parent's list
     * actually need to run inside this "is it the frontend" branch.
     */
    protected function frontendMiddleware()
    {
        $middleware = array_values(array_filter(array_unique([
            config('sanctum.middleware.validate_csrf_token', config('sanctum.middleware.verify_csrf_token', \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class)),
            config('sanctum.middleware.authenticate_session'),
        ])));

        array_unshift($middleware, function ($request, $next) {
            $request->attributes->set('sanctum', true);

            return $next($request);
        });

        return $middleware;
    }
}
