<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Job;
use Illuminate\Console\Command;

/**
 * Takes listings off the board once their closing date has passed.
 *
 * Without this a job stays published indefinitely: deadline_at is set on
 * every listing and shown to candidates, but nothing was acting on it, so a
 * vacancy filled months ago would keep collecting applications.
 */
class ExpireJobs extends Command
{
    protected $signature = 'jobs:expire {--dry-run : Report what would expire without changing anything}';

    protected $description = 'Move published jobs past their deadline to expired';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $query = Job::query()
            ->where('status', Job::STATUS_PUBLISHED)
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '<', now());

        $count = $query->count();

        if ($count === 0) {
            $this->info('No listings have passed their deadline.');

            return self::SUCCESS;
        }

        foreach ($query->clone()->limit(20)->get() as $job) {
            $this->line("  {$job->reference}: {$job->title} (closed {$job->deadline_at?->toDateString()})");
        }

        if ($dryRun) {
            $this->info("Dry run: {$count} listing(s) would be expired.");

            return self::SUCCESS;
        }

        /*
         * Updated in one statement rather than row by row.
         *
         * closed_at is deliberately left alone: it records a deliberate
         * closure by an employer or moderator, and a deadline passing is
         * neither. The two are different events and the employer's analytics
         * distinguish them.
         */
        $query->update([
            'status' => Job::STATUS_EXPIRED,
            'updated_at' => now(),
        ]);

        $this->info("Expired {$count} listing(s).");

        return self::SUCCESS;
    }
}
