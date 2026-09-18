<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Job;
use App\Models\JobAlert;
use App\Notifications\JobAlertDigest;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Sends each due job alert the roles posted since it last went out.
 *
 * Scheduled hourly rather than daily: an alert set to "daily" is due 24 hours
 * after its own last send, not at one fixed hour for everybody, which would
 * put the whole platform's mail into a single spike.
 */
class SendJobAlerts extends Command
{
    protected $signature = 'jobs:send-alerts
                            {--frequency= : Only send alerts of this frequency}
                            {--dry-run : Report what would be sent without sending}';

    protected $description = 'Email candidates the new jobs matching their saved searches';

    /** How many jobs one digest lists before it becomes a wall of text. */
    private const MAX_JOBS_PER_DIGEST = 10;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $query = JobAlert::query()
            ->where('is_active', true)
            ->with('user');

        if ($frequency = $this->option('frequency')) {
            $query->where('frequency', $frequency);
        }

        $sent = 0;
        $skipped = 0;

        // Chunked: a platform with thousands of alerts must not load them all
        // into memory to send a digest.
        $query->chunkById(100, function ($alerts) use (&$sent, &$skipped, $dryRun) {
            foreach ($alerts as $alert) {
                if (! $this->isDue($alert)) {
                    $skipped++;

                    continue;
                }

                $jobs = $this->matchingJobs($alert);

                if ($jobs->isEmpty()) {
                    /*
                     * Nothing to send, but the clock still moves on.
                     *
                     * Without this an alert that matches nothing would keep
                     * widening its window forever, then one day send months
                     * of accumulated jobs at once.
                     */
                    if (! $dryRun) {
                        $alert->forceFill(['last_sent_at' => now()])->save();
                    }

                    $skipped++;

                    continue;
                }

                $this->line("  {$alert->name}: {$jobs->count()} job(s) → {$alert->user?->email}");

                if (! $dryRun) {
                    $alert->user?->notify(new JobAlertDigest($alert, $jobs));
                    $alert->forceFill(['last_sent_at' => now()])->save();
                }

                $sent++;
            }
        });

        $this->info($dryRun
            ? "Dry run: {$sent} digest(s) would be sent, {$skipped} skipped."
            : "Sent {$sent} digest(s), skipped {$skipped}.");

        return self::SUCCESS;
    }

    /** Whether enough time has passed since this alert last went out. */
    private function isDue(JobAlert $alert): bool
    {
        if ($alert->last_sent_at === null) {
            return true;
        }

        $due = match ($alert->frequency) {
            'daily' => $alert->last_sent_at->addDay(),
            'weekly' => $alert->last_sent_at->addWeek(),
            'monthly' => $alert->last_sent_at->addMonth(),
            default => $alert->last_sent_at->addWeek(),
        };

        return $due->isPast();
    }

    /**
     * Published jobs matching the alert's filters, posted since it last sent.
     *
     * @return Collection<int, Job>
     */
    private function matchingJobs(JobAlert $alert)
    {
        $since = $alert->last_sent_at ?? $this->defaultWindow($alert);

        $query = Job::query()
            ->where('status', Job::STATUS_PUBLISHED)
            ->where('published_at', '>', $since)
            ->where('published_at', '<=', now());

        if ($alert->job_category_id) {
            $query->where('job_category_id', $alert->job_category_id);
        }

        if ($alert->industry_id) {
            $query->where('industry_id', $alert->industry_id);
        }

        if ($alert->country_id) {
            $query->where('country_id', $alert->country_id);
        }

        if ($alert->city_id) {
            $query->where('city_id', $alert->city_id);
        }

        if ($alert->employment_type) {
            $query->where('employment_type', $alert->employment_type);
        }

        if ($alert->is_remote) {
            $query->where('is_remote', true);
        }

        if ($alert->salary_min !== null) {
            // Compared against the job's ceiling: a role paying 80–120k does
            // match someone asking for at least 100k.
            $query->where('salary_max', '>=', $alert->salary_min);
        }

        if (filled($alert->keywords)) {
            $like = '%'.str_replace('%', '\%', trim($alert->keywords)).'%';

            $query->where(fn (Builder $q) => $q
                ->where('title', 'ilike', $like)
                ->orWhere('description', 'ilike', $like));
        }

        return $query
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->limit(self::MAX_JOBS_PER_DIGEST)
            ->get();
    }

    /**
     * The window for an alert that has never been sent.
     *
     * Bounded by the alert's own age as well as its frequency, so a brand new
     * weekly alert does not open with a week of jobs the candidate has
     * already scrolled past.
     */
    private function defaultWindow(JobAlert $alert): Carbon
    {
        $byFrequency = match ($alert->frequency) {
            'daily' => now()->subDay(),
            'monthly' => now()->subMonth(),
            default => now()->subWeek(),
        };

        $created = $alert->created_at ?? $byFrequency;

        return $created->greaterThan($byFrequency) ? $created : $byFrequency;
    }
}
