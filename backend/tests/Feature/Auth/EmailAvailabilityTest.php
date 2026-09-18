<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    User::factory()->role('job_seeker')->create(['email' => 'taken@example.com']);
});

it('reports an address that is already registered', function () {
    postJson('/api/v1/auth/email/available', ['email' => 'taken@example.com'])
        ->assertOk()
        ->assertJsonPath('data.available', false);
});

it('reports an address that is free', function () {
    postJson('/api/v1/auth/email/available', ['email' => 'nobody@example.com'])
        ->assertOk()
        ->assertJsonPath('data.available', true);
});

it('matches addresses regardless of case or padding', function () {
    // Registration lowercases and trims before storing, so the check has to
    // do the same or it would call a taken address free.
    postJson('/api/v1/auth/email/available', ['email' => '  TAKEN@Example.com '])
        ->assertOk()
        ->assertJsonPath('data.available', false);
});

it('rejects input that is not an address', function () {
    postJson('/api/v1/auth/email/available', ['email' => 'not-an-address'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('discloses nothing about the account behind an address', function () {
    $response = postJson('/api/v1/auth/email/available', ['email' => 'taken@example.com'])
        ->assertOk()
        ->json('data');

    // Only the address asked about and a yes/no. Anything more would turn
    // this into a way of reading member records.
    expect(array_keys($response))->toBe(['email', 'available']);
});
