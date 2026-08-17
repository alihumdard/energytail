<?php

use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api/v1)
|--------------------------------------------------------------------------
|
| The prefix is set in bootstrap/app.php via withRouting(apiPrefix: 'api/v1').
|
| Route groups are added per work package:
|   WP1.3  auth (below)      WP1.5  taxonomy
|   WP1.4  roles             WP1.6  users, settings, audit logs
|
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'environment' => config('app.env'),
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.health');

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->name('api.auth.')->group(function () {

    // Guests only. Throttled because these endpoints are the ones worth
    // brute-forcing: credentials, account creation and reset tokens.
    Route::middleware(['guest', 'throttle:auth'])->group(function () {
        Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
        Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
        Route::post('/password/forgot', [PasswordController::class, 'forgot'])->name('password.forgot');
        Route::post('/password/reset', [PasswordController::class, 'reset'])->name('password.reset');
    });

    // Verification links are opened from an email client, often in a browser
    // with no session, so this route cannot require authentication. The
    // signature plus the email hash are what secure it.
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('email.verify');

    // Social sign-in. Session-based, so these are GET redirects rather than
    // API calls the frontend makes with fetch.
    Route::middleware('throttle:auth')->group(function () {
        Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect'])
            ->name('social.redirect');
        Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback'])
            ->name('social.callback');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthenticatedSessionController::class, 'me'])->name('me');
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
        Route::put('/password', [PasswordController::class, 'change'])->name('password.change');

        Route::post('/email/resend', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:6,1')
            ->name('email.resend');
    });
});
