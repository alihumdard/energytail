<?php

use function Pest\Laravel\getJson;

it('reports healthy on the versioned api prefix', function () {
    getJson('/api/v1/health')
        ->assertOk()
        ->assertJsonPath('status', 'ok')
        ->assertJsonStructure(['status', 'app', 'environment', 'timestamp']);
});

it('rejects unauthenticated access to protected routes with the standard error shape', function () {
    getJson('/api/v1/auth/me')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'unauthenticated')
        ->assertJsonStructure(['message', 'code']);
});

it('returns the standard error shape for unknown api routes', function () {
    getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertJsonPath('code', 'not_found');
});
