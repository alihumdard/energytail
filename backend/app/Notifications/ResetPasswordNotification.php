<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/**
 * Branded replacement for Laravel's built-in reset mail.
 *
 * The link points at the frontend form rather than an API route, because the
 * user has to type a new password before anything is submitted.
 */
class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Retries across a rising delay rather than failing on the first refusal.
     *
     * A relay that is briefly unreachable, rate-limiting, or mid-restart is
     * the common case, and none of those are worth losing a reset link
     * over. Anything still failing after the third attempt is a real
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

    public function __construct(public string $token) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) Config::get('auth.passwords.users.expire', 60);
        $frontend = rtrim((string) Config::get('app.frontend_url'), '/');

        $url = $frontend.'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Reset your password')
            ->view('emails.reset-password', [
                'user' => $notifiable,
                'url' => $url,
                'minutes' => $minutes,
            ]);
    }
}
