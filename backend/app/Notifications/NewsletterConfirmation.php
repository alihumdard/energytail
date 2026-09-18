<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Asks the owner of an address to confirm they want the newsletter.
 *
 * Queued like every other mail here, so a slow SMTP connection never blocks
 * the signup form the visitor is waiting on.
 */
class NewsletterConfirmation extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(
        private readonly string $email,
        private readonly string $token,
    ) {}

    /** @return array<int, int> */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return (new MailMessage)
            ->subject('Confirm your Energy Tail subscription')
            ->greeting('One more step')
            ->line('Someone asked us to send the Energy Tail newsletter to this address.')
            ->action('Confirm subscription', "{$frontend}/newsletter/confirm?token={$this->token}")
            /*
             * The "ignore this" line matters: anyone can type another
             * person's address into a public form, and this email is what a
             * wrongly-entered address sees. Doing nothing must be a valid
             * response that leaves them off the list.
             */
            ->line('If that was not you, ignore this email — nothing further will be sent.');
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return ['email' => $this->email];
    }
}
