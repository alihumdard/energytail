<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/**
 * Sent once an address is confirmed, pointing each role at what it can
 * actually do — the plan gives job seekers, employers and authors different
 * starting points.
 */
class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Retries across a rising delay rather than failing on the first refusal.
     *
     * A relay that is briefly unreachable, rate-limiting, or mid-restart is
     * the common case, and none of those are worth losing a welcome
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
        $frontend = rtrim((string) Config::get('app.frontend_url'), '/');
        $role = $notifiable->getRoleNames()->first() ?? 'job_seeker';

        $next = match ($role) {
            'employer' => [
                'heading' => 'Start hiring',
                'body' => 'Set up your company profile, then post your first role.',
                'label' => 'Go to your dashboard',
                'path' => '/employer-dashboard',
            ],
            'author' => [
                'heading' => 'Start writing',
                'body' => 'Draft your first article. Articles are reviewed before they go live.',
                'label' => 'Go to your dashboard',
                'path' => '/author-dashboard',
            ],
            default => [
                'heading' => 'Find your next role',
                'body' => 'Upload your CV and complete your profile so employers can find you.',
                'label' => 'Browse jobs',
                'path' => '/jobs',
            ],
        };

        return (new MailMessage)
            ->subject('Welcome to '.Config::get('app.name'))
            ->view('emails.welcome', [
                'user' => $notifiable,
                'next' => $next,
                'url' => $frontend.$next['path'],
            ]);
    }
}
