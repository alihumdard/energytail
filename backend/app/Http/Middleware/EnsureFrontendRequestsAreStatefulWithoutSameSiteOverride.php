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
}
