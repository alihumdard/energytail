<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

/**
 * Points authentication emails at the Next.js frontend.
 *
 * By default Laravel builds these links against APP_URL, which is the API.
 * A user clicking a verification link would land on a JSON endpoint instead
 * of a page. Both notifications are rewritten to target the frontend, which
 * then calls the API to complete the action.
 */
class AuthNotificationServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        VerifyEmail::createUrlUsing(function (object $notifiable) use ($frontend) {
            // Signed against the API route, then handed to the frontend as a
            // query parameter. The frontend calls that URL to verify, so the
            // signature stays valid and unforgeable.
            $signedApiUrl = URL::temporarySignedRoute(
                'api.auth.email.verify',
                now()->addMinutes((int) config('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );

            return "{$frontend}/verify-email?url=".urlencode($signedApiUrl);
        });

        ResetPassword::createUrlUsing(
            fn (object $notifiable, string $token) => "{$frontend}/reset-password?token={$token}"
                .'&email='.urlencode($notifiable->getEmailForPasswordReset())
        );
    }
}
