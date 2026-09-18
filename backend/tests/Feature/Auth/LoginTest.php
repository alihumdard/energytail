<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->user = User::factory()->role('job_seeker')->create([
        'email' => 'ali@example.com',
        'password' => Hash::make('Str0ng!Passw0rd'),
    ]);
});

it('signs in with correct credentials', function () {
    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])
        ->assertOk()
        ->assertJsonPath('data.email', 'ali@example.com')
        ->assertJsonPath('data.roles.0', 'job_seeker');

    $this->assertAuthenticatedAs($this->user);
});

it('records the sign-in time and address', function () {
    expect($this->user->last_login_at)->toBeNull();

    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])->assertOk();

    $this->user->refresh();

    expect($this->user->last_login_at)->not->toBeNull()
        ->and($this->user->last_login_ip)->not->toBeNull();
});

it('rejects a wrong password', function () {
    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'WrongPassword1!',
    ])->assertStatus(422)->assertJsonValidationErrors('email');

    $this->assertGuest();
});

it('gives the same answer for unknown emails and wrong passwords', function () {
    $unknown = postJson('/api/v1/auth/login', [
        'email' => 'nobody@example.com',
        'password' => 'Str0ng!Passw0rd',
    ]);

    $wrongPassword = postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'WrongPassword1!',
    ]);

    // Identical responses, so the endpoint cannot be used to discover which
    // email addresses have accounts.
    expect($unknown->json('errors.email'))
        ->toBe($wrongPassword->json('errors.email'));
});

it('blocks a suspended account and says why', function () {
    $this->user->update(['status' => 'suspended']);

    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');

    expect(postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])->json('errors.email.0'))->toContain('suspended');

    $this->assertGuest();
});

it('blocks a soft deleted account', function () {
    $this->user->delete();

    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])->assertStatus(422);

    $this->assertGuest();
});

it('returns the current user when signed in', function () {
    actingAs($this->user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', 'ali@example.com')
        ->assertJsonStructure(['data' => ['id', 'full_name', 'roles', 'permissions']]);
});

it('refuses the current user endpoint to guests', function () {
    getJson('/api/v1/auth/me')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'unauthenticated');
});

it('signs out and destroys the session', function () {
    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
    ])->assertOk();

    $sessionIdWhileSignedIn = session()->getId();

    expect($this->loginSessionKeys())->toHaveCount(1);

    postJson('/api/v1/auth/logout')->assertOk();

    // Assert on session state rather than a follow-up request: within a single
    // test the framework keeps the user resolved from the earlier request, so
    // hitting /auth/me here would report 200 even though a real browser gets
    // 401. The session is the thing that actually carries the login.
    expect($this->loginSessionKeys())->toBeEmpty()
        ->and(session()->getId())->not->toBe($sessionIdWhileSignedIn);
});

it('throttles repeated failed sign-in attempts', function () {
    foreach (range(1, 5) as $ignored) {
        postJson('/api/v1/auth/login', [
            'email' => 'ali@example.com',
            'password' => 'WrongPassword1!',
        ])->assertStatus(422);
    }

    // The sixth attempt within the window is refused outright.
    postJson('/api/v1/auth/login', [
        'email' => 'ali@example.com',
        'password' => 'WrongPassword1!',
    ])
        ->assertStatus(429)
        ->assertJsonPath('code', 'too_many_requests');
});

it('throttles per account rather than per address', function () {
    foreach (range(1, 5) as $ignored) {
        postJson('/api/v1/auth/login', [
            'email' => 'ali@example.com',
            'password' => 'WrongPassword1!',
        ]);
    }

    // A different account from the same IP is unaffected, so one user cannot
    // lock out everyone behind a shared office connection.
    postJson('/api/v1/auth/login', [
        'email' => 'someone-else@example.com',
        'password' => 'WrongPassword1!',
    ])->assertStatus(422);
});

it('exposes role permissions so the frontend can render navigation', function () {
    $employer = User::factory()->role('employer')->create();

    $permissions = actingAs($employer)
        ->getJson('/api/v1/auth/me')
        ->json('data.permissions');

    expect($permissions)->toContain('jobs.add')
        ->and($permissions)->not->toContain('users.delete');
});

/*
 * Regression: the sign-in routes carried Laravel's stock 'guest' middleware,
 * which answers an authenticated caller with a 302 to an HTML page. The SPA
 * parses every reply as JSON, so signing in from a tab that already held a
 * session failed silently with no message for the user.
 */
it('answers an already-authenticated sign-in attempt in json', function () {
    actingAs($this->user)
        ->postJson('/api/v1/auth/login', [
            'email' => 'ali@example.com',
            'password' => 'Str0ng!Passw0rd',
        ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'already_authenticated');
});

it('answers an already-authenticated registration attempt in json', function () {
    actingAs($this->user)
        ->postJson('/api/v1/auth/register', [
            'first_name' => 'Someone',
            'last_name' => 'Else',
            'email' => 'someone-else@example.com',
            'password' => 'Str0ng!Passw0rd',
            'password_confirmation' => 'Str0ng!Passw0rd',
            'role' => 'job_seeker',
            'terms_accepted' => true,
        ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'already_authenticated');
});
