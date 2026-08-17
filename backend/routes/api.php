<?php

use App\Http\Controllers\Api\V1\Admin\AuditLogController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\ArticleCategoryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\CityController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\CountryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\IndustryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\JobCategoryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\SkillController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\TagController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Api\V1\Public\PublicTaxonomyController;
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

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
|
| Every route requires an authenticated, non-suspended account. Finer-grained
| checks live in policies rather than here, so a permission change takes
| effect without a routing change.
|
*/

Route::prefix('admin')->name('api.admin.')
    ->middleware(['auth:sanctum', 'active'])
    ->group(function () {

        // Matrix definition first: a literal segment would otherwise be
        // captured by the {role} parameter on the resource routes below.
        Route::get('/roles/matrix', [RoleController::class, 'matrix'])->name('roles.matrix');

        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions'])
            ->name('roles.permissions.sync');
        Route::get('/roles/{role}/users', [RoleController::class, 'users'])->name('roles.users');

        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');

        /*
        | Users
        */
        Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');
        Route::get('/users/export', [UserController::class, 'export'])->name('users.export');
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
        Route::post('/users/{user}/password-reset', [UserController::class, 'sendPasswordReset'])
            ->name('users.password_reset');

        /*
        | Settings
        */
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::post('/settings/file', [SettingController::class, 'uploadFile'])->name('settings.file');

        /*
        | Audit logs
        */
        Route::get('/audit-logs/filters', [AuditLogController::class, 'filters'])->name('audit.filters');
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats'])->name('audit.stats');
        Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->name('audit.export');
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit.index');

        /*
        | Taxonomy resources. All six share BaseTaxonomyController, so the
        | route shape is identical and registered from one loop rather than
        | repeated six times.
        */
        $taxonomies = [
            'industries' => IndustryController::class,
            'job-categories' => JobCategoryController::class,
            'article-categories' => ArticleCategoryController::class,
            'countries' => CountryController::class,
            'cities' => CityController::class,
            'skills' => SkillController::class,
            'tags' => TagController::class,
        ];

        foreach ($taxonomies as $slug => $controller) {
            Route::prefix($slug)->name(str_replace('-', '_', $slug).'.')->group(function () use ($controller) {
                // Literal segments first, so they are not swallowed by {id}.
                Route::get('/stats', [$controller, 'stats'])->name('stats');
                Route::get('/export', [$controller, 'export'])->name('export');
                Route::post('/reorder', [$controller, 'reorder'])->name('reorder');

                Route::get('/', [$controller, 'index'])->name('index');
                Route::post('/', [$controller, 'store'])->name('store');
                Route::get('/{id}', [$controller, 'show'])->whereNumber('id')->name('show');
                Route::put('/{id}', [$controller, 'update'])->whereNumber('id')->name('update');
                Route::delete('/{id}', [$controller, 'destroy'])->whereNumber('id')->name('destroy');
                Route::patch('/{id}/active', [$controller, 'toggleActive'])->whereNumber('id')->name('active');
            });
        }
    });

/*
|--------------------------------------------------------------------------
| Public Taxonomy
|--------------------------------------------------------------------------
|
| Read-only, unauthenticated, active records only. Feeds search filters and
| category landing pages on the public site.
|
*/

// Site name, logo, contact details — read on every page of the frontend.
Route::get('/settings', [SettingController::class, 'publicSettings'])->name('api.settings.public');

Route::prefix('taxonomies')->name('api.taxonomies.')->group(function () {
    Route::get('/', [PublicTaxonomyController::class, 'all'])->name('all');
    Route::get('/countries', [PublicTaxonomyController::class, 'countries'])->name('countries');
    Route::get('/cities', [PublicTaxonomyController::class, 'cities'])->name('cities');
    Route::get('/industries', [PublicTaxonomyController::class, 'industries'])->name('industries');
    Route::get('/job-categories', [PublicTaxonomyController::class, 'jobCategories'])->name('job_categories');
    Route::get('/article-categories', [PublicTaxonomyController::class, 'articleCategories'])->name('article_categories');
    Route::get('/skills', [PublicTaxonomyController::class, 'skills'])->name('skills');
    Route::get('/tags', [PublicTaxonomyController::class, 'tags'])->name('tags');
});
