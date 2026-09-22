<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureFrontendRequestsAreStatefulWithoutSameSiteOverride;
use App\Http\Middleware\EnsureGuestForApi;
use App\Http\Middleware\VerifyCaptcha;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Nginx terminates TLS and proxies to PHP-FPM over plain HTTP, so
        // without this Laravel sees every request as HTTP — $request->isSecure()
        // is false, the "Secure" cookie flag never gets set, and a browser
        // refuses to store or send a SameSite=None cookie without it. That
        // silently drops the session on every cross-subdomain request between
        // energytail.com and api.energytail.com, including a plain login,
        // and surfaces as a CSRF token mismatch. '*' trusts the proxy in
        // front of this app (this VPS's own Nginx), not arbitrary clients —
        // a client can't set X-Forwarded-Proto for itself from outside it.
        $middleware->trustProxies(at: '*');

        // Cookie-based SPA auth for the Next.js frontend. This registers
        // Sanctum's middleware, which owns the whole session pipeline for
        // API routes: EncryptCookies, StartSession and CSRF all run inside
        // it. Laravel's middleware priority deliberately sorts it ahead of
        // those, so adding a second copy of them here would run them in the
        // wrong order — before it, not inside it.
        $middleware->statefulApi();

        // Two things about Sanctum's own version make it wrong here, both
        // explained in the replacement: it forces the session cookie's
        // SameSite to 'lax' regardless of SESSION_SAME_SITE, and it skips
        // session handling for requests whose Origin/Referer isn't the
        // frontend — which the OAuth callback, arriving from Google, is.
        $middleware->replaceInGroup(
            'api',
            EnsureFrontendRequestsAreStateful::class,
            EnsureFrontendRequestsAreStatefulWithoutSameSiteOverride::class,
        );

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'verified' => EnsureEmailIsVerified::class,
            'active' => EnsureAccountIsActive::class,

            // Replaces Laravel's 'guest' on API routes, which answers with an
            // HTML redirect the SPA cannot read.
            'guest.api' => EnsureGuestForApi::class,

            'captcha' => VerifyCaptcha::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // One error shape for every API failure, so the frontend has a single
        // path to handle them. See App\Exceptions\ApiExceptionRenderer.
        $exceptions->render(new ApiExceptionRenderer);
    })->create();
