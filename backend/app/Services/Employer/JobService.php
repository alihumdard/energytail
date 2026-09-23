<?php

declare(strict_types=1);

namespace App\Services\Employer;

use App\Models\Company;
use App\Models\Job;
use App\Models\Setting;
use App\Models\User;
use App\Services\Billing\SubscriptionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JobService
{
    public function __construct(
        private readonly SubscriptionService $subscriptions,
    ) {}

    /**
     * Creates a listing for the company the employer posts under.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function create(User $user, array $data): Job
    {
        /*
         * An administrator names the company; an employer's is implied.
         *
         * Administrators own no company of their own, so without this they
         * could not post at all — and posting on an employer's behalf is a
         * normal support task. The request only accepts company_id from an
         * administrator, so an employer cannot use it to post as someone else.
         */
        $company = isset($data['company_id'])
            ? Company::find($data['company_id'])
            : $user->primaryCompany();

        if ($company === null) {
            throw ValidationException::withMessages([
                'company' => [$user->hasRole('administrator')
                    ? 'Choose the company this job is for.'
                    : 'Set up your company profile before posting a job.'],
            ]);
        }

        /*
         * The plan's posting limit.
         *
         * Enforced here rather than in the controller so every path that
         * creates a job passes through it — a limit the API can be talked
         * past is not a limit. Administrators are exempt: posting on an
         * employer's behalf is a support task, not a purchase.
         */
        if (! $user->hasRole('administrator') && ! $this->subscriptions->canPostJob($company)) {
            throw ValidationException::withMessages([
                'plan' => [$this->subscriptions->postingBlockedReason($company)
                    ?? 'Your plan does not allow another job posting.'],
            ]);
        }

        return DB::transaction(function () use ($user, $company, $data): Job {
            $publishNow = ($data['status'] ?? 'published') !== Job::STATUS_DRAFT;

            /** @var Job $job */
            $job = Job::query()->create($this->attributes($data) + [
                'company_id' => $company->getKey(),
                'posted_by' => $user->getKey(),
                'reference' => $this->reference(),
                'slug' => $this->slug($data['title']),
                'status' => $publishNow ? $this->statusForNewJob() : Job::STATUS_DRAFT,
                'published_at' => $publishNow && ! $this->requiresApproval() ? now() : null,

                // Nothing is featured or urgent by choice: the plan sells
                // both as paid placements, so they are set by the package a
                // job is posted under, never by the form.
                'is_featured' => false,
                'is_urgent' => false,
            ]);

            $this->syncSkills($job, $data);

            // Counted against the plan once the job exists. An administrator
            // posting on an employer's behalf does not consume the allowance.
            if (! $user->hasRole('administrator')) {
                $this->subscriptions->recordJobPosted($company);
            }

            return $job->fresh(['company', 'skills']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Job $job, array $data): Job
    {
        return DB::transaction(function () use ($job, $data): Job {
            $attributes = $this->attributes($data);

            /*
             * A published job that is edited goes back for review when
             * moderation is on. Otherwise an employer could publish an
             * innocuous listing, wait for approval, then rewrite it.
             */
            if ($job->status === Job::STATUS_PUBLISHED && $this->requiresApproval()) {
                $attributes['status'] = Job::STATUS_PENDING_REVIEW;
            }

            $job->update($attributes);

            $this->syncSkills($job, $data);

            return $job->fresh(['company', 'skills']);
        });
    }

    /**
     * Puts a closed or expired listing back on the board.
     *
     * The deadline is pushed out too: reopening a job whose deadline has
     * passed would publish it straight back into the expired bucket.
     */
    public function reopen(Job $job): Job
    {
        $days = (int) Setting::value('job_default_duration_days', 30);

        $job->update([
            'status' => $this->statusForNewJob(),
            'closed_at' => null,
            'published_at' => $this->requiresApproval() ? null : now(),
            'deadline_at' => $job->deadline_at?->isFuture()
                ? $job->deadline_at
                : now()->addDays($days),
        ]);

        return $job->fresh(['company']);
    }

    /**
     * Whether new and edited listings wait for a moderator.
     *
     * Read from settings rather than hard-coded: the plan gates articles on
     * approval and says nothing about jobs, and the seeded default matches
     * that — but a board that starts attracting spam needs the switch
     * without a deployment.
     */
    private function requiresApproval(): bool
    {
        return (bool) Setting::value('jobs_require_approval', false);
    }

    private function statusForNewJob(): string
    {
        return $this->requiresApproval()
            ? Job::STATUS_PENDING_REVIEW
            : Job::STATUS_PUBLISHED;
    }

    /**
     * Fields an employer may set, separated from the ones they may not.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        $days = (int) Setting::value('job_default_duration_days', 30);

        return [
            'title' => $data['title'],
            'job_category_id' => $data['job_category_id'] ?? null,
            'industry_id' => $data['industry_id'] ?? null,
            'country_id' => $data['country_id'] ?? null,
            'city_id' => $data['city_id'] ?? null,
            'location_label' => $data['location_label'] ?? null,
            'employment_type' => $data['employment_type'] ?? null,
            'is_remote' => $data['is_remote'] ?? false,
            'description' => $data['description'],
            'responsibilities' => $data['responsibilities'] ?? null,
            'requirements' => $data['requirements'] ?? null,
            'benefits' => $data['benefits'] ?? null,

            /*
             * Only written when the caller resolved one.
             *
             * This list is a whitelist, so a key absent from it is dropped
             * before the insert — which is how the upload reached disk and
             * the column stayed null. It cannot default to null either: an
             * edit that leaves the picture alone sends no key, and a null
             * default would wipe the existing image on every save.
             */
            ...(array_key_exists('featured_image_path', $data)
                ? ['featured_image_path' => $data['featured_image_path']]
                : []),
            'experience_min' => $data['experience_min'] ?? null,
            'experience_max' => $data['experience_max'] ?? null,
            'salary_min' => $data['salary_min'] ?? null,
            'salary_max' => $data['salary_max'] ?? null,
            'salary_currency' => $data['salary_currency'] ?? null,
            'salary_period' => $data['salary_period'] ?? null,
            'salary_is_hidden' => $data['salary_is_hidden'] ?? false,
            'apply_method' => $data['apply_method'],
            'apply_url' => $data['apply_url'] ?? null,
            'apply_email' => $data['apply_email'] ?? null,
            'deadline_at' => $data['deadline_at'] ?? now()->addDays($days),
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
        ];
    }

    /** @param  array<string, mixed>  $data */
    private function syncSkills(Job $job, array $data): void
    {
        if (! array_key_exists('skills', $data)) {
            return;
        }

        $job->skills()->sync($data['skills'] ?? []);
    }

    /**
     * A slug that stays unique without a lookup loop.
     *
     * The suffix is what makes two "Drilling Engineer" postings from
     * different companies both addressable.
     */
    private function slug(string $title): string
    {
        return Str::slug($title).'-'.Str::lower(Str::random(6));
    }

    /** Human-quotable reference, as the public detail page shows. */
    private function reference(): string
    {
        do {
            $reference = 'ET-'.random_int(100000, 999999);
        } while (Job::query()->where('reference', $reference)->exists());

        return $reference;
    }
}
