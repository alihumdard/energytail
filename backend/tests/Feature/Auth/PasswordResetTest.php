<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->user = User::factory()->role('job_seeker')->create([
        'email' => 'ali@example.com',
        'password' => Hash::make('Old!Passw0rd'),
    ]);
});

it('sends a reset link for a known address', function () {
    Notification::fake();

    postJson('/api/v1/auth/password/forgot', ['email' => 'ali@example.com'])
        ->assertOk();

    Notification::assertSentTo($this->user, ResetPassword::class);
});

it('gives the same answer for an unknown address', function () {
    Notification::fake();

    $known = postJson('/api/v1/auth/password/forgot', ['email' => 'ali@example.com']);
    $unknown = postJson('/api/v1/auth/password/forgot', ['email' => 'nobody@example.com']);

    // Identical responses, so this endpoint cannot be used to discover which
    // addresses are registered.
    expect($unknown->json('message'))->toBe($known->json('message'));

    Notification::assertSentToTimes($this->user, ResetPassword::class, 1);
});

it('points the reset email at the frontend', function () {
    Notification::fake();

    postJson('/api/v1/auth/password/forgot', ['email' => 'ali@example.com'])->assertOk();

    Notification::assertSentTo($this->user, ResetPassword::class, function ($notification) {
        $url = $notification->toMail($this->user)->actionUrl;

        return str_starts_with($url, config('app.frontend_url').'/reset-password')
            && str_contains($url, 'token=')
            && str_contains($url, 'email=');
    });
});

it('resets the password with a valid token', function () {
    $token = Password::createToken($this->user);

    postJson('/api/v1/auth/password/reset', [
        'token' => $token,
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ])->assertOk();

    expect(Hash::check('Brand!New1Pass', $this->user->fresh()->password))->toBeTrue();
});

it('lets the user sign in with the new password afterwards', function () {
    $token = Password::createToken($this->user);

    postJson('/api/v1/auth/password/reset', [
        'token' => $token,
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ])->assertOk();

    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
    ])->assertOk();
});

it('rejects an invalid reset token', function () {
    postJson('/api/v1/auth/password/reset', [
        'token' => 'not-a-real-token',
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'invalid_reset_token');

    expect(Hash::check('Old!Passw0rd', $this->user->fresh()->password))->toBeTrue();
});

it('will not reuse a reset token', function () {
    $token = Password::createToken($this->user);

    $payload = [
        'token' => $token,
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ];

    postJson('/api/v1/auth/password/reset', $payload)->assertOk();

    // A second use must fail, otherwise a leaked link stays usable forever.
    postJson('/api/v1/auth/password/reset', $payload)->assertStatus(422);
});

it('enforces the password policy on reset', function () {
    $token = Password::createToken($this->user);

    postJson('/api/v1/auth/password/reset', [
        'token' => $token,
        'email' => 'ali@example.com',
        'password' => 'weak',
        'password_confirmation' => 'weak',
    ])->assertStatus(422)->assertJsonValidationErrors('password');
});

it('revokes api tokens when the password is reset', function () {
    $this->user->createToken('mobile');

    expect($this->user->tokens()->count())->toBe(1);

    postJson('/api/v1/auth/password/reset', [
        'token' => Password::createToken($this->user),
        'email' => 'ali@example.com',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ])->assertOk();

    // A reset usually follows a suspected compromise, so other devices must
    // lose access too.
    expect($this->user->tokens()->count())->toBe(0);
});

it('changes the password for a signed-in user', function () {
    actingAs($this->user)
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'Old!Passw0rd',
            'password' => 'Brand!New1Pass',
            'password_confirmation' => 'Brand!New1Pass',
        ])->assertOk();

    expect(Hash::check('Brand!New1Pass', $this->user->fresh()->password))->toBeTrue();
});

it('requires the current password to change it', function () {
    actingAs($this->user)
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'WrongOldPass1!',
            'password' => 'Brand!New1Pass',
            'password_confirmation' => 'Brand!New1Pass',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

    expect(Hash::check('Old!Passw0rd', $this->user->fresh()->password))->toBeTrue();
});

it('refuses a new password identical to the current one', function () {
    actingAs($this->user)
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'Old!Passw0rd',
            'password' => 'Old!Passw0rd',
            'password_confirmation' => 'Old!Passw0rd',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
});

it('requires sign-in to change a password', function () {
    putJson('/api/v1/auth/password', [
        'current_password' => 'Old!Passw0rd',
        'password' => 'Brand!New1Pass',
        'password_confirmation' => 'Brand!New1Pass',
    ])->assertUnauthorized();
});
