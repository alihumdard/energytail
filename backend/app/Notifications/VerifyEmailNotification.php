<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * Branded replacement for Laravel's built-in verification mail.
 *
 * Queued so registration answers immediately: talking to SMTP inline made the
 * user wait on Gmail, and a slow relay read as a hung sign-up.
 */
class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Retries across a rising delay rather than failing on the first refusal.
     *
     * A relay that is briefly unreachable, rate-limiting, or mid-restart is
     * the common case, and none of those are worth losing a verification
     * email over. Anything still failing after the third attempt is a real
     * fault — bad credentials, a rejected sender — and lands in failed_jobs
     * to be retried by hand once it is fixed.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public int $tries = 3;

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) Config::get('auth.verification.expire', 60);

        /*
         * The signature covers the API URL, but sending people to raw JSON is
         * no good, so the link points at the frontend page carrying the signed
         * URL as a parameter. The page calls it and shows the result.
         */
        $signedUrl = URL::temporarySignedRoute(
            'api.auth.email.verify',
            Carbon::now()->addMinutes($minutes),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1((string) $notifiable->getEmailForVerification()),
            ]
        );

        $frontend = rtrim((string) Config::get('app.frontend_url'), '/');
        $url = $frontend.'/verify-email?url='.urlencode($signedUrl);

        return (new MailMessage)
            ->subject('Confirm your email address')
            ->view('emails.verify-email', [
                'user' => $notifiable,
                'url' => $url,
                'minutes' => $minutes,
            ]);
    }
}
