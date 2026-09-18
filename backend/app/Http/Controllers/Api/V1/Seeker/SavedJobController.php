<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\SavedJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A candidate's saved jobs.
 *
 * Scoped to the caller throughout. There is no policy class here because
 * there is no shared ownership to arbitrate: a saved job belongs to exactly
 * one user, and the query is filtered by that user's id on every path.
 */
class SavedJobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SavedJob::query()
            ->where('user_id', $request->user()?->getKey())
            ->with([
                'job:id,title,slug,company_id,status,employment_type,is_remote,location_label,salary_min,salary_max,salary_currency,salary_period,salary_is_hidden,published_at,deadline_at',
                'job.company:id,name,slug,logo_path',
            ])
            ->latest('id');

        $perPage = min(50, max(1, $request->integer('per_page', 15)));
        $saved = $query->paginate($perPage);

        return response()->json([
            'data' => collect($saved->items())
                ->map(fn (SavedJob $row) => $this->transform($row))
                ->all(),
            'meta' => [
                'current_page' => $saved->currentPage(),
                'last_page' => $saved->lastPage(),
                'per_page' => $saved->perPage(),
                'total' => $saved->total(),
            ],
        ]);
    }

    /**
     * Saves a job.
     *
     * Idempotent: saving twice updates the note rather than failing, because
     * the button that calls this cannot know whether an earlier tab already
     * saved the same listing.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_id' => ['required', 'integer', 'exists:jobs,id'],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $saved = SavedJob::query()->updateOrCreate(
            [
                'user_id' => $request->user()?->getKey(),
                'job_id' => $validated['job_id'],
            ],
            ['note' => $validated['note'] ?? null],
        );

        $saved->load(['job:id,title,slug,company_id,status', 'job.company:id,name,slug']);

        return response()->json([
            'message' => 'Job saved.',
            'data' => $this->transform($saved),
        ], 201);
    }

    /**
     * Unsaves a job.
     *
     * Keyed by job id rather than the saved-job row id: the button that
     * removes it sits on a job card, which knows the job and not the row.
     */
    public function destroy(Request $request, int $job): JsonResponse
    {
        $deleted = SavedJob::query()
            ->where('user_id', $request->user()?->getKey())
            ->where('job_id', $job)
            ->delete();

        // 200 either way. Reporting "not found" would tell a caller whether
        // somebody else had saved that job, and the outcome the user asked
        // for — the job is not saved — holds regardless.
        return response()->json([
            'message' => $deleted > 0 ? 'Job removed from your saved list.' : 'Job was not saved.',
        ]);
    }

    /**
     * Which of the given jobs the caller has saved.
     *
     * Lets a board of job cards render their save buttons in one request
     * rather than one per card.
     */
    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'job_ids' => ['required', 'array', 'max:100'],
            'job_ids.*' => ['integer'],
        ]);

        $saved = SavedJob::query()
            ->where('user_id', $request->user()?->getKey())
            ->whereIn('job_id', $validated['job_ids'])
            ->pluck('job_id')
            ->all();

        return response()->json(['data' => $saved]);
    }

    /** @return array<string, mixed> */
    private function transform(SavedJob $saved): array
    {
        $job = $saved->job;

        return [
            'id' => $saved->id,
            'note' => $saved->note,
            'saved_at' => $saved->created_at?->toIso8601String(),
            'job' => $job === null ? null : [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'status' => $job->status,
                /*
                 * Whether the listing is still live.
                 *
                 * A saved job that has closed or expired stays in the list —
                 * the candidate saved it deliberately — but the page has to
                 * be able to say so rather than link them to a dead vacancy.
                 */
                'is_open' => $job->status === Job::STATUS_PUBLISHED,
                'employment_type' => $job->employment_type,
                'is_remote' => $job->is_remote,
                'location_label' => $job->location_label,
                'published_at' => $job->published_at?->toIso8601String(),
                'deadline_at' => $job->deadline_at?->toIso8601String(),
                'company' => $job->relationLoaded('company') && $job->company
                    ? [
                        'name' => $job->company->name,
                        'slug' => $job->company->slug,
                    ]
                    : null,
            ],
        ];
    }
}
