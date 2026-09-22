<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

/**
 * Sanctum's stateful middleware, with two of its decisions overridden.
 *
 * Everything else — the order EncryptCookies, StartSession and CSRF run in,
 * and the fact that they run inside this middleware rather than beside it —
 * is left alone. Laravel's middleware priority sorts this class ahead of
 * those three, so registering them in the api group as well would run them
 * before this, outside the pipeline that expects to own them.
 */
class EnsureFrontendRequestsAreStatefulWithoutSameSiteOverride extends EnsureFrontendRequestsAreStateful
{
    /**
     * Leaves session.same_site alone, where the parent forces it to 'lax'.
     *
     * The frontend (energytail.com) calls the API on another subdomain
     * (api.energytail.com), so a fetch() from it is a cross-site request —
     * unlike the OAuth redirect, which is a top-level navigation Lax allows.
     * A Lax cookie is never sent on those calls, so the backend saw a guest,
     * started a fresh session, and the CSRF token bound to it never matched
     * the one the page already held: "CSRF token mismatch" on ordinary API
     * calls. SESSION_SAME_SITE=none in .env is what this setup needs.
     */
    protected function configureSecureCookieSessions()
    {
        //
    }

    /**
     * Runs the parent's pipeline for every API request, not just "frontend" ones.
     *
     * The parent decides by Origin/Referer against SANCTUM_STATEFUL_DOMAINS,
     * and skips session handling entirely when that doesn't match. The OAuth
     * callback is exactly that case — it arrives from accounts.google.com —
     * so it got no session, and the "state" this app stored before
     * redirecting to Google was unreadable on the way back.
     *
     * Nothing here is bearer-token-only, so there is no request that needs
     * the parent's skip: a client without a session cookie simply starts a
     * new session, as it would on any web route.
     */
    public static function fromFrontend($request)
    {
        return true;
    }
}
