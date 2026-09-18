<?php

use App\Models\Company;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Session;

use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/** @return array<string, mixed> */
function validRegistration(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Ali',
        'last_name' => 'Raza',
        'email' => 'ali@example.com',
        'password' => 'Str0ng!Passw0rd',
        'password_confirmation' => 'Str0ng!Passw0rd',
        'role' => 'job_seeker',
        'terms_accepted' => true,
    ], $overrides);
}

it('registers a job seeker and assigns the role', function () {
    Event::fake([Registered::class]);

    postJson('/api/v1/auth/register', validRegistration())
        ->assertCreated()
        ->assertJsonPath('data.email', 'ali@example.com')
        ->assertJsonPath('data.full_name', 'Ali Raza')
        ->assertJsonPath('data.email_verified', false)
        ->assertJsonPath('data.roles.0', 'job_seeker');

    $user = User::where('email', 'ali@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->hasRole('job_seeker'))->toBeTrue()
        ->and($user->status)->toBe('active');

    // Drives the verification email.
    Event::assertDispatched(Registered::class);
});

it('registers employers and authors with their chosen role', function (string $role) {
    postJson('/api/v1/auth/register', validRegistration([
        'email' => "{$role}@example.com",
        'role' => $role,
        // Required for employers, ignored for everyone else.
        'company_name' => 'PetroEnergy Solutions',
    ]))->assertCreated()->assertJsonPath('data.roles.0', $role);
})->with(['employer', 'author']);

it('creates the company an employer will post jobs under', function () {
    postJson('/api/v1/auth/register', validRegistration([
        'email' => 'employer@example.com',
        'role' => 'employer',
        'company_name' => 'PetroEnergy Solutions',
        'company_website' => 'https://petroenergy.example',
    ]))->assertCreated();

    $user = User::where('email', 'employer@example.com')->firstOrFail();
    $company = Company::where('owner_id', $user->id)->firstOrFail();

    expect($company->name)->toBe('PetroEnergy Solutions')
        ->and($company->slug)->toBe('petroenergy-solutions')
        ->and($company->website)->toBe('https://petroenergy.example')
        // Pending until someone fills it in — the plan gates no employer at
        // sign-up, but an empty profile should not appear in public listings.
        ->and($company->status)->toBe(Company::STATUS_PENDING);
});

it('requires a company name from employers only', function () {
    postJson('/api/v1/auth/register', validRegistration([
        'email' => 'employer@example.com',
        'role' => 'employer',
    ]))->assertStatus(422)->assertJsonValidationErrors('company_name');

    // The same payload is fine for a job seeker, for whom it means nothing.
    postJson('/api/v1/auth/register', validRegistration([
        'email' => 'seeker@example.com',
        'role' => 'job_seeker',
    ]))->assertCreated();
});

it('gives two companies of the same name distinct urls', function () {
    postJson('/api/v1/auth/register', validRegistration([
        'email' => 'first@example.com',
        'role' => 'employer',
        'company_name' => 'Delta Energy',
    ]))->assertCreated();

    // Registration signs the new user in, and the route is guests-only, so
    // the second sign-up has to start from a clean session — as it would in
    // a different browser.
    Auth::logout();
    Session::flush();

    postJson('/api/v1/auth/register', validRegistration([
        'email' => 'second@example.com',
        'role' => 'employer',
        'company_name' => 'Delta Energy',
    ]))->assertCreated();

    expect(Company::where('name', 'Delta Energy')->pluck('slug')->all())
        ->toBe(['delta-energy', 'delta-energy-2']);
});

it('refuses to create an administrator through public registration', function () {
    postJson('/api/v1/auth/register', validRegistration(['role' => 'administrator']))
        ->assertStatus(422)
        ->assertJsonPath('code', 'validation_failed')
        ->assertJsonValidationErrors('role');

    expect(User::where('email', 'ali@example.com')->exists())->toBeFalse();
});

it('rejects weak passwords', function (string $password) {
    postJson('/api/v1/auth/register', validRegistration([
        'password' => $password,
        'password_confirmation' => $password,
    ]))->assertStatus(422)->assertJsonValidationErrors('password');
})->with([
    'short' => 'Ab1!x',
    'no uppercase' => 'str0ng!passw0rd',
    'no number' => 'Strong!Password',
    'no symbol' => 'Str0ngPassw0rd',
]);

it('requires the password confirmation to match', function () {
    postJson('/api/v1/auth/register', validRegistration([
        'password_confirmation' => 'Different!Passw0rd',
    ]))->assertStatus(422)->assertJsonValidationErrors('password');
});

it('requires the terms to be accepted', function () {
    postJson('/api/v1/auth/register', validRegistration(['terms_accepted' => false]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('terms_accepted');
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'ali@example.com']);

    postJson('/api/v1/auth/register', validRegistration())
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('normalises email casing and whitespace', function () {
    postJson('/api/v1/auth/register', validRegistration([
        'email' => '  ALI@Example.COM  ',
    ]))->assertCreated();

    expect(User::where('email', 'ali@example.com')->exists())->toBeTrue();
});

it('never returns the password hash', function () {
    postJson('/api/v1/auth/register', validRegistration())
        ->assertCreated()
        ->assertJsonMissing(['password'])
        ->assertJsonMissingPath('data.password');
});
