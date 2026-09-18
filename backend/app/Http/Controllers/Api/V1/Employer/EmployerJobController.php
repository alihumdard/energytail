<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\StoreJobRequest;
use App\Http\Requests\Employer\UpdateJobRequest;
use App\Models\Job;
use App\Services\Employer\JobService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * An employer's own job listings.
 *
 * Every read is scoped to the companies the caller may act for, and every
 * write goes through JobPolicy. Scoping the query as well as checking the
 * policy is deliberate: a listing endpoint that returned everything and
 * relied on a per-row check would leak competitors' drafts through counts
 * and pagination even when each row was withheld.
 */
class EmployerJobController extends Controller
{
    public function __construct(private readonly JobService $jobs) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Job::class);

        $companyIds = $this->companyIds($request);

        $query = Job::query()
            ->whereIn('company_id', $companyIds)
            ->with([
                'company:id,name,slug',
                'category:id,name,slug',
                'country:id,name,code,flag_emoji',
                'city:id,name',
            ]);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';
            $query->where(fn (Builder $q) => $q
                ->where('title', 'ilike', $like)
                ->orWhere('reference', 'ilike', $like));
        }

        $query->latest('created_at')->orderByDesc('id');

        $perPage = min(50, max(1, $request->integer('per_page', 15)));
        $jobs = $query->paginate($perPage);

        return response()->json([
            'data' => collect($jobs->items())->map(fn (Job $job) => $this->transform($job))->all(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /** Counts by status, for the dashboard strip. */
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Job::class);

        $companyIds = $this->companyIds($request);

        $byStatus = Job::query()
            ->whereIn('company_id', $companyIds)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totals = Job::query()
            ->whereIn('company_id', $companyIds)
            ->selectRaw('coalesce(sum(views_count), 0) as views, coalesce(sum(apply_clicks_count), 0) as clicks')
            ->first();

        return response()->json([
            'data' => [
                'total' => (int) $byStatus->sum(),
                'published' => (int) ($byStatus[Job::STATUS_PUBLISHED] ?? 0),
                'draft' => (int) ($byStatus[Job::STATUS_DRAFT] ?? 0),
                'pending_review' => (int) ($byStatus[Job::STATUS_PENDING_REVIEW] ?? 0),
                'expired' => (int) ($byStatus[Job::STATUS_EXPIRED] ?? 0),
                'closed' => (int) ($byStatus[Job::STATUS_CLOSED] ?? 0),
                // What an employer actually gets in place of applicant
                // tracking: how many saw the listing and how many clicked
                // through to apply.
                'views' => (int) ($totals->views ?? 0),
                'apply_clicks' => (int) ($totals->clicks ?? 0),
            ],
        ]);
    }

    public function show(Job $job): JsonResponse
    {
        $this->authorize('view', $job);

        $job->load(['company:id,name,slug', 'skills:id,name,slug', 'tags:id,name,slug']);

        return response()->json(['data' => $this->transform($job, detailed: true)]);
    }

    public function store(StoreJobRequest $request): JsonResponse
    {
        $this->authorize('create', Job::class);

        $job = $this->jobs->create($request->user(), $request->validated());

        return response()->json([
            // Three outcomes, not two: a draft is neither live nor waiting on
            // a moderator, and telling the employer it had been "sent for
            // review" would leave them expecting an approval that never comes.
            'message' => match ($job->status) {
                Job::STATUS_PUBLISHED => 'Job published.',
                Job::STATUS_PENDING_REVIEW => 'Job saved and sent for review.',
                default => 'Job saved as a draft.',
            },
            'data' => $this->transform($job, detailed: true),
        ], 201);
    }

    public function update(UpdateJobRequest $request, Job $job): JsonResponse
    {
        $this->authorize('update', $job);

        $job = $this->jobs->update($job, $request->validated());

        return response()->json([
            'message' => 'Job updated.',
            'data' => $this->transform($job, detailed: true),
        ]);
    }

    /**
     * Closes a listing.
     *
     * Closing rather than deleting: the job keeps its public URL, its view
     * history and the clicks it earned, all of which the employer paid for
     * and the analytics report on.
     */
    public function close(Job $job): JsonResponse
    {
        $this->authorize('update', $job);

        if ($job->status === Job::STATUS_CLOSED) {
            throw ValidationException::withMessages([
                'status' => ['This job is already closed.'],
            ]);
        }

        $job->update(['status' => Job::STATUS_CLOSED, 'closed_at' => now()]);

        return response()->json([
            'message' => 'Job closed.',
            'data' => $this->transform($job->fresh()),
        ]);
    }

    public function reopen(Job $job): JsonResponse
    {
        $this->authorize('update', $job);

        $job = $this->jobs->reopen($job);

        return response()->json([
            'message' => $job->status === Job::STATUS_PUBLISHED
                ? 'Job reopened.'
                : 'Job reopened and sent for review.',
            'data' => $this->transform($job),
        ]);
    }

    /**
     * The companies this caller may post under.
     *
     * @return array<int, int>
     */
    private function companyIds(Request $request): array
    {
        $user = $request->user();

        return $user->ownedCompanies()->pluck('id')
            ->merge($user->companies()->pluck('companies.id'))
            ->unique()
            ->all();
    }

    /** @return array<string, mixed> */
    private function transform(Job $job, bool $detailed = false): array
    {
        $base = [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'slug' => $job->slug,
            'status' => $job->status,
            'employment_type' => $job->employment_type,
            'is_remote' => $job->is_remote,
            'is_featured' => $job->is_featured,
            'location_label' => $job->location_label,
            'views_count' => $job->views_count,
            'apply_clicks_count' => $job->apply_clicks_count,
            'published_at' => $job->published_at?->toIso8601String(),
            'deadline_at' => $job->deadline_at?->toIso8601String(),
            'created_at' => $job->created_at?->toIso8601String(),
            'company' => $job->relationLoaded('company') && $job->company
                ? ['id' => $job->company->id, 'name' => $job->company->name]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'job_category_id' => $job->job_category_id,
            'industry_id' => $job->industry_id,
            'country_id' => $job->country_id,
            'city_id' => $job->city_id,
            'description' => $job->description,
            'responsibilities' => $job->responsibilities,
            'requirements' => $job->requirements,
            'benefits' => $job->benefits,
            'experience_min' => $job->experience_min,
            'experience_max' => $job->experience_max,
            'salary_min' => $job->salary_min,
            'salary_max' => $job->salary_max,
            'salary_currency' => $job->salary_currency,
            'salary_period' => $job->salary_period,
            'salary_is_hidden' => $job->salary_is_hidden,
            'apply_method' => $job->apply_method,
            'apply_url' => $job->apply_url,
            'apply_email' => $job->apply_email,
            'skills' => $job->relationLoaded('skills')
                ? $job->skills->pluck('id')->all()
                : [],
        ];
    }
}
