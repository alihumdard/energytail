<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Services\Admin\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Every job on the platform, for moderation.
 *
 * Unlike the employer workspace this is not scoped to a company — an
 * administrator sees drafts, expired listings and everyone's postings,
 * because approving and removing them is the point.
 */
class AdminJobController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        /*
         * 'approve', not 'viewAny'.
         *
         * An employer holds jobs.view for their own listings, so viewAny
         * would let them page through every job on the platform — including
         * competitors' drafts. The moderation permission is the real gate.
         */
        $this->authorize('approve', Job::class);

        $query = Job::query()->with([
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
                ->orWhere('reference', 'ilike', $like)
                ->orWhereHas('company', fn (Builder $c) => $c->where('name', 'ilike', $like)));
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', $request->boolean('featured'));
        }

        if ($companyId = $request->integer('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Pending review first: a moderation queue should open on the work
        // waiting to be done, not on the newest listing.
        $query->orderByRaw('case when status = ? then 0 else 1 end', [Job::STATUS_PENDING_REVIEW])
            ->latest('created_at')
            ->orderByDesc('id');

        $perPage = min(100, max(1, $request->integer('per_page', 15)));
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

    public function stats(): JsonResponse
    {
        $this->authorize('approve', Job::class);

        $byStatus = Job::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $byStatus->sum();

        return response()->json([
            'data' => [
                'stats' => [
                    'total' => $total,
                    'published' => (int) ($byStatus[Job::STATUS_PUBLISHED] ?? 0),
                    'draft' => (int) ($byStatus[Job::STATUS_DRAFT] ?? 0),
                    'pending_review' => (int) ($byStatus[Job::STATUS_PENDING_REVIEW] ?? 0),
                    'expired' => (int) ($byStatus[Job::STATUS_EXPIRED] ?? 0),
                    'closed' => (int) ($byStatus[Job::STATUS_CLOSED] ?? 0),
                    'featured' => Job::query()->where('is_featured', true)->count(),
                ],
                'donut' => $this->donut($byStatus, $total),
            ],
        ]);
    }

    /** Publishes a listing that was waiting for review. */
    public function approve(Job $job): JsonResponse
    {
        $this->authorize('approve', Job::class);

        if ($job->status === Job::STATUS_PUBLISHED) {
            throw ValidationException::withMessages([
                'status' => ['This job is already published.'],
            ]);
        }

        $job->update([
            'status' => Job::STATUS_PUBLISHED,
            // Set on approval rather than on submission: published_at is what
            // orders the public board, and a listing held for a week should
            // not appear a week old the moment it goes live.
            'published_at' => now(),
            'closed_at' => null,
        ]);

        $this->audit->log('jobs', 'approved', "Approved job {$job->reference}: {$job->title}", $job);

        return response()->json([
            'message' => 'Job published.',
            'data' => $this->transform($job->fresh(['company', 'category', 'country', 'city'])),
        ]);
    }

    /**
     * Takes a listing off the board.
     *
     * Closed rather than deleted, and the reason is recorded: the employer
     * paid for the placement and is entitled to know why it was pulled.
     */
    public function reject(Request $request, Job $job): JsonResponse
    {
        $this->authorize('approve', Job::class);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $job->update(['status' => Job::STATUS_CLOSED, 'closed_at' => now()]);

        $this->audit->log(
            'jobs',
            'rejected',
            "Rejected job {$job->reference}: {$validated['reason']}",
            $job,
        );

        return response()->json([
            'message' => 'Job removed from the board.',
            'data' => $this->transform($job->fresh(['company', 'category', 'country', 'city'])),
        ]);
    }

    /**
     * Toggles the paid placement.
     *
     * An administrator sets this, never the employer: the plan sells featured
     * placement, so it follows a purchase rather than a checkbox on a form.
     */
    public function toggleFeatured(Job $job): JsonResponse
    {
        $this->authorize('update', $job);

        $featured = ! $job->is_featured;
        $job->update(['is_featured' => $featured]);

        $this->audit->log(
            'jobs',
            'updated',
            ($featured ? 'Featured' : 'Unfeatured')." job {$job->reference}",
            $job,
        );

        return response()->json([
            'message' => $featured ? 'Job featured.' : 'Job no longer featured.',
            'data' => $this->transform($job->fresh(['company', 'category', 'country', 'city'])),
        ]);
    }

    public function destroy(Job $job): JsonResponse
    {
        $this->authorize('delete', $job);

        $reference = $job->reference;
        $title = $job->title;

        // Soft delete: the public URL is indexed and the view history belongs
        // to the employer's analytics.
        $job->delete();

        $this->audit->log('jobs', 'deleted', "Deleted job {$reference}: {$title}");

        return response()->json(['message' => 'Job deleted.']);
    }

    /**
     * @param  Collection<string, int>  $byStatus
     * @return array<int, array<string, mixed>>
     */
    private function donut(Collection $byStatus, int $total): array
    {
        $colours = [
            Job::STATUS_PUBLISHED => ['Published', '#10b981'],
            Job::STATUS_DRAFT => ['Draft', '#f59e0b'],
            Job::STATUS_PENDING_REVIEW => ['Pending Review', '#3b82f6'],
            Job::STATUS_EXPIRED => ['Expired', '#ef4444'],
            Job::STATUS_CLOSED => ['Closed', '#94a3b8'],
        ];

        $divisor = max(1, $total);

        return collect($colours)->map(function (array $meta, string $status) use ($byStatus, $divisor) {
            $count = (int) ($byStatus[$status] ?? 0);

            return [
                'label' => $meta[0],
                'value' => $count,
                'pct' => round($count / $divisor * 100, 1),
                'color' => $meta[1],
            ];
        })->values()->all();
    }

    /** @return array<string, mixed> */
    private function transform(Job $job): array
    {
        return [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'slug' => $job->slug,
            'status' => $job->status,
            'employment_type' => $job->employment_type,
            'is_remote' => $job->is_remote,
            'is_featured' => $job->is_featured,
            'is_urgent' => $job->is_urgent,
            'location_label' => $job->location_label,
            'views_count' => $job->views_count,
            'apply_clicks_count' => $job->apply_clicks_count,
            'published_at' => $job->published_at?->toIso8601String(),
            'deadline_at' => $job->deadline_at?->toIso8601String(),
            'created_at' => $job->created_at?->toIso8601String(),
            'company' => $job->relationLoaded('company') && $job->company ? [
                'id' => $job->company->id,
                'name' => $job->company->name,
                'slug' => $job->company->slug,
            ] : null,
            'category' => $job->relationLoaded('category') && $job->category
                ? ['name' => $job->category->name, 'slug' => $job->category->slug]
                : null,
            'country' => $job->relationLoaded('country') && $job->country
                ? ['name' => $job->country->name, 'code' => $job->country->code]
                : null,
            'city' => $job->relationLoaded('city') && $job->city
                ? ['name' => $job->city->name]
                : null,
        ];
    }
}
