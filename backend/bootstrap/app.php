<?php

use App\Exceptions\ApiExceptionRenderer;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;

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
        $middleware->api(prepend: [
            AddQueuedCookiesToResponse::class,
            StartSession::class,
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
