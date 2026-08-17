<?php

use App\Models\SocialAccount;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

use function Pest\Laravel\get;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function fakeSocialUser(array $overrides = []): SocialiteUser
{
    return SocialiteUser::fake(array_merge([
        'id' => 'provider-user-123',
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'avatar' => 'https://example.com/avatar.jpg',
    ], $overrides));
}

it('redirects to the provider', function (string $provider, string $driver) {
    Socialite::fake($driver);

    get("/api/v1/auth/social/{$provider}/redirect")->assertRedirect();
})->with([
    ['google', 'google'],
    ['linkedin', 'linkedin-openid'],
]);

it('rejects an unknown provider', function () {
    get('/api/v1/auth/social/myspace/redirect')
        ->assertNotFound()
        ->assertJsonPath('code', 'unsupported_provider');
});

it('creates an account on first sign-in and links the provider', function () {
    Socialite::fake('google', fakeSocialUser());

    get('/api/v1/auth/social/google/callback')
        ->assertRedirect(config('app.frontend_url').'/auth/callback?status=success');

    $user = User::where('email', 'ada@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->first_name)->toBe('Ada')
        ->and($user->last_name)->toBe('Lovelace')
        // The provider already verified the address, so a second verification
        // email would be pointless friction.
        ->and($user->hasVerifiedEmail())->toBeTrue()
        ->and($user->hasRole('job_seeker'))->toBeTrue();

    expect(SocialAccount::where('provider', 'google')
        ->where('provider_user_id', 'provider-user-123')
        ->where('user_id', $user->id)
        ->exists())->toBeTrue();

    $this->assertAuthenticatedAs($user);
});

it('signs the same person in again without duplicating the account', function () {
    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    expect(User::where('email', 'ada@example.com')->count())->toBe(1)
        ->and(SocialAccount::where('provider', 'google')->count())->toBe(1);
});

it('links the provider to an existing account with the same email', function () {
    $existing = User::factory()->role('employer')->create([
        'email' => 'ada@example.com',
    ]);

    Socialite::fake('google', fakeSocialUser());

    get('/api/v1/auth/social/google/callback')->assertRedirect();

    // One account, not a duplicate the user could never reconcile — and the
    // role they already had is preserved.
    expect(User::where('email', 'ada@example.com')->count())->toBe(1)
        ->and($existing->fresh()->hasRole('employer'))->toBeTrue()
        ->and(SocialAccount::where('user_id', $existing->id)->exists())->toBeTrue();

    $this->assertAuthenticatedAs($existing);
});

it('keeps google and linkedin identities separate on one account', function () {
    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    Socialite::fake('linkedin-openid', fakeSocialUser(['id' => 'linkedin-999']));
    get('/api/v1/auth/social/linkedin/callback');

    $user = User::where('email', 'ada@example.com')->first();

    expect(User::where('email', 'ada@example.com')->count())->toBe(1)
        ->and(SocialAccount::where('user_id', $user->id)->count())->toBe(2);
});

it('sends the user back to login when the provider shares no email', function () {
    Socialite::fake('google', fakeSocialUser(['email' => null]));

    get('/api/v1/auth/social/google/callback')
        ->assertRedirect(config('app.frontend_url').'/login?error=social_failed');

    expect(User::count())->toBe(0);
    $this->assertGuest();
});

it('refuses to sign in a suspended account', function () {
    User::factory()->role('job_seeker')->create([
        'email' => 'ada@example.com',
        'status' => 'suspended',
    ]);

    Socialite::fake('google', fakeSocialUser());

    get('/api/v1/auth/social/google/callback')
        ->assertRedirect(config('app.frontend_url').'/login?error=account_suspended');

    $this->assertGuest();
});

it('applies the role chosen before the redirect', function () {
    Socialite::fake('google');
    get('/api/v1/auth/social/google/redirect?role=employer');

    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    expect(User::where('email', 'ada@example.com')->first()->hasRole('employer'))
        ->toBeTrue();
});

it('ignores an attempt to claim the administrator role', function () {
    Socialite::fake('google');
    get('/api/v1/auth/social/google/redirect?role=administrator');

    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    $user = User::where('email', 'ada@example.com')->first();

    // Falls back to the default rather than granting the requested role.
    expect($user->hasRole('administrator'))->toBeFalse()
        ->and($user->hasRole('job_seeker'))->toBeTrue();
});

it('stores provider tokens encrypted and hides them from serialisation', function () {
    Socialite::fake('google', fakeSocialUser());
    get('/api/v1/auth/social/google/callback');

    $account = SocialAccount::first();

    expect($account->toArray())->not->toHaveKey('access_token')
        ->and($account->toArray())->not->toHaveKey('refresh_token');

    // Encrypted at rest: a database dump must not yield working tokens.
    $raw = DB::table('social_accounts')->where('id', $account->id)->first();

    expect($raw->access_token)->not->toBe($account->access_token);
});
