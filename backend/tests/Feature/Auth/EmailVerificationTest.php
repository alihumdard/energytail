<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
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

    Notification::assertSentTo($this->user, VerifyEmail::class);
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

    Notification::assertSentTo($this->user, VerifyEmail::class, function ($notification) {
        $mail = $notification->toMail($this->user);
        $url = $mail->actionUrl;

        // The link must open a frontend page, not a raw JSON endpoint, and
        // must carry the signed API URL for that page to call.
        return str_starts_with($url, config('app.frontend_url').'/verify-email')
            && str_contains($url, 'url=');
    });
});
