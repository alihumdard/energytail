<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api/v1)
|--------------------------------------------------------------------------
|
| The prefix is set in bootstrap/app.php via withRouting(apiPrefix: 'api/v1').
| Versioning it from day one means a future /api/v2 can run alongside this one
| when the mobile app needs breaking changes.
|
| Route groups are added per work package:
|   WP1.3  auth        WP1.5  taxonomy
|   WP1.4  roles       WP1.6  users, settings, audit logs
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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user())->name('api.user');
});
