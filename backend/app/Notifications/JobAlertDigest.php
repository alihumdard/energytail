<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Job;
use App\Models\JobAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

/**
 * The jobs matching a saved search since it was last sent.
 *
 * Queued like every other mail here: a digest run touching hundreds of alerts
 * must not block the scheduler, and a dead SMTP connection should retry
 * rather than lose the send.
 */
class JobAlertDigest extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @param  Collection<int, Job>  $jobs */
    public function __construct(
        private readonly JobAlert $alert,
        private readonly Collection $jobs,
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
        $count = $this->jobs->count();
        $frontend = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        $message = (new MailMessage)
            ->subject($count === 1
                ? "1 new job matching \"{$this->alert->name}\""
                : "{$count} new jobs matching \"{$this->alert->name}\"")
            ->greeting('New roles for you')
            ->line("Here is what has been posted since we last wrote, for your \"{$this->alert->name}\" alert.");

        foreach ($this->jobs as $job) {
            $where = $job->is_remote
                ? 'Remote'
                : ($job->location_label ?: 'Location not stated');

            $message->line("**{$job->title}** — {$where}");
        }

        return $message
            ->action('View all matching jobs', "{$frontend}/jobs")
            /*
             * Every digest carries its own way out. An alert email without an
             * obvious way to stop it is what gets a sending domain marked as
             * spam, however well-intentioned the mail is.
             */
            ->line("Too many emails? Pause or delete this alert at {$frontend}/job-alerts.");
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'alert_id' => $this->alert->id,
            'alert_name' => $this->alert->name,
            'job_count' => $this->jobs->count(),
        ];
    }
}
