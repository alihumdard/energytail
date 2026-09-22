<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureGuestForApi;
use App\Http\Middleware\VerifyCaptcha;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;
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
        // Cookie-based SPA auth for the Next.js frontend. Mobile clients use
        // bearer tokens instead and skip this path entirely.
        $middleware->statefulApi();

        // statefulApi() only attaches session state to requests whose origin
        // matches SANCTUM_STATEFUL_DOMAINS. Sessions are needed on every API
        // request here, because login, registration and the OAuth round trip
        // all depend on one. Without this the session store is never set and
        // those endpoints fail outright.
        //
        // EncryptCookies has to run unconditionally too, not just when
        // statefulApi() decides a request is "from the frontend" (it checks
        // Origin/Referer). The OAuth round trip breaks otherwise: the
        // redirect to Google carries a Referer of energytail.com, so that
        // request gets an encrypted session cookie, but Google's callback
        // carries a Referer of accounts.google.com — statefulApi() would
        // treat that as third-party and skip encryption, so Laravel reads
        // back a cookie it never encrypted and starts a blank session,
        // taking the OAuth "state" it needs to validate the callback with it.
        $middleware->api(prepend: [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
        ]);

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
