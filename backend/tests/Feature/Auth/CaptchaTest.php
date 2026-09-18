<?php

use App\Services\Auth\CaptchaVerifier;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** A registration payload the validator is happy with. */
function captchaRegistration(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Ali',
        'last_name' => 'Hamid',
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
        'password_confirmation' => 'Str0ng!Passw0rd',
        'role' => 'job_seeker',
        'terms_accepted' => true,
    ], $overrides);
}

it('lets requests through when captcha is disabled', function () {
    config(['captcha.enabled' => false]);

    // The default in development and in the test suite, so no live keys are
    // needed to work on anything else.
    postJson('/api/v1/auth/register', captchaRegistration())->assertCreated();
});

it('refuses a submission with no token when captcha is enabled', function () {
    config(['captcha.enabled' => true, 'captcha.secret' => 'test-secret']);

    postJson('/api/v1/auth/register', captchaRegistration())
        ->assertStatus(422)
        ->assertJsonValidationErrors('captcha');
});

it('accepts a token the provider verifies', function () {
    config(['captcha.enabled' => true, 'captcha.secret' => 'test-secret']);

    Http::fake([
        'www.google.com/*' => Http::response(['success' => true, 'score' => 0.9]),
    ]);

    postJson('/api/v1/auth/register', captchaRegistration(['captcha_token' => 'good']))
        ->assertCreated();
});

it('refuses a token the provider rejects', function () {
    config(['captcha.enabled' => true, 'captcha.secret' => 'test-secret']);

    Http::fake([
        'www.google.com/*' => Http::response(['success' => false]),
    ]);

    postJson('/api/v1/auth/register', captchaRegistration(['captcha_token' => 'bad']))
        ->assertStatus(422)
        ->assertJsonValidationErrors('captcha');
});

it('refuses a score below the threshold', function () {
    config([
        'captcha.enabled' => true,
        'captcha.secret' => 'test-secret',
        'captcha.minimum_score' => 0.5,
    ]);

    Http::fake([
        'www.google.com/*' => Http::response(['success' => true, 'score' => 0.1]),
    ]);

    postJson('/api/v1/auth/register', captchaRegistration(['captcha_token' => 'weak']))
        ->assertStatus(422)
        ->assertJsonValidationErrors('captcha');
});

it('refuses rather than passing when the provider is unreachable', function () {
    config(['captcha.enabled' => true, 'captcha.secret' => 'test-secret']);

    Http::fake(fn () => throw new ConnectionException('Network unreachable'));

    // Failing open would make an outage at the provider a way past the check.
    expect(app(CaptchaVerifier::class)->verify('token'))->toBeFalse();
});

it('fails loudly when enabled without a secret', function () {
    config(['captcha.enabled' => true, 'captcha.secret' => null]);

    // Silently passing would leave the forms advertising protection they do
    // not have, and the misconfiguration would be invisible.
    expect(fn () => app(CaptchaVerifier::class)->verify('token'))
        ->toThrow(RuntimeException::class);
});
