<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\WelcomeNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->user = User::factory()->unverified()->role('job_seeker')->create();
});

function verificationUrl(User $user, ?string $email = null): string
{
    return URL::temporarySignedRoute('api.auth.email.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1($email ?? $user->getEmailForVerification()),
    ]);
}

it('verifies an email from a signed link', function () {
    expect($this->user->hasVerifiedEmail())->toBeFalse();

    getJson(verificationUrl($this->user))->assertOk();

    expect($this->user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('rejects a link with a broken signature', function () {
    $tampered = verificationUrl($this->user).'&tampered=1';

    getJson($tampered)
        ->assertForbidden()
        ->assertJsonPath('code', 'invalid_signature');

    expect($this->user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects an expired link', function () {
    $url = URL::temporarySignedRoute('api.auth.email.verify', now()->subMinute(), [
        'id' => $this->user->id,
        'hash' => sha1($this->user->getEmailForVerification()),
    ]);

    getJson($url)->assertForbidden();

    expect($this->user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects a link whose hash does not match the current email', function () {
    // Simulates a link issued before the user changed their address.
    getJson(verificationUrl($this->user, 'old-address@example.com'))
        ->assertForbidden()
        ->assertJsonPath('code', 'invalid_signature');

    expect($this->user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('reports success when the email is already verified', function () {
    $this->user->markEmailAsVerified();

    getJson(verificationUrl($this->user))
        ->assertOk()
        ->assertJsonPath('message', 'Your email is already verified.');
});

it('resends the verification email on request', function () {
    Notification::fake();

    actingAs($this->user)
        ->postJson('/api/v1/auth/email/resend')
        ->assertOk();

    Notification::assertSentTo($this->user, VerifyEmailNotification::class);
});

it('does not resend once the address is verified', function () {
    Notification::fake();

    $this->user->markEmailAsVerified();

    actingAs($this->user)
        ->postJson('/api/v1/auth/email/resend')
        ->assertOk()
        ->assertJsonPath('message', 'Your email is already verified.');

    Notification::assertNothingSent();
});

it('requires sign-in to request a resend', function () {
    postJson('/api/v1/auth/email/resend')->assertUnauthorized();
});

it('points the verification email at the frontend', function () {
    Notification::fake();

    $this->user->sendEmailVerificationNotification();

    Notification::assertSentTo($this->user, VerifyEmailNotification::class, function ($notification) {
        // Read from the view data rather than actionUrl: the branded mail
        // renders its own template instead of Laravel's action button.
        $url = $notification->toMail($this->user)->viewData['url'];

        // The link must open a frontend page, not a raw JSON endpoint, and
        // must carry the signed API URL for that page to call.
        return str_starts_with($url, config('app.frontend_url').'/verify-email')
            && str_contains($url, 'url=');
    });
});

it('holds a user to a cooldown between verification emails', function () {
    Notification::fake();

    actingAs($this->user)->postJson('/api/v1/auth/email/resend')->assertOk();

    /*
     * The route throttle is keyed by IP, so on its own it does nothing to
     * stop one account being used to post mail at an address repeatedly —
     * which is what gets a sending domain marked as spam.
     */
    actingAs($this->user)
        ->postJson('/api/v1/auth/email/resend')
        ->assertStatus(429)
        ->assertJsonPath('code', 'resend_cooldown');

    Notification::assertSentToTimes($this->user, VerifyEmailNotification::class, 1);
});

it('tells the caller how long the cooldown has left', function () {
    Notification::fake();

    $first = actingAs($this->user)->postJson('/api/v1/auth/email/resend')->assertOk();
    expect($first->json('retry_after'))->toBeGreaterThan(0);

    $second = actingAs($this->user)->postJson('/api/v1/auth/email/resend')->assertStatus(429);
    expect($second->json('retry_after'))->toBeGreaterThan(0);
});

it('sends a welcome email once an address is confirmed', function () {
    Notification::fake();

    $url = URL::temporarySignedRoute('api.auth.email.verify', now()->addHour(), [
        'id' => $this->user->id,
        'hash' => sha1($this->user->getEmailForVerification()),
    ]);

    getJson($url)->assertOk();

    Notification::assertSentTo($this->user, WelcomeNotification::class);
});
