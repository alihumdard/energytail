<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Services\Admin\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Every article on the platform, for moderation.
 *
 * Articles are the one thing the plan actually gates on approval — the
 * seeded settings say so: articles_require_approval is on, while
 * jobs_require_approval is off. This is where that gate is worked.
 */
class AdminArticleController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        /*
         * 'approve', not 'viewAny'.
         *
         * A job seeker holds articles.view so they can read published pieces,
         * which would otherwise let them page through every draft, pending
         * and rejected article here — review notes included.
         */
        $this->authorize('approve', Article::class);

        $query = Article::query()->with([
            'author:id,first_name,last_name,email',
            'category:id,name,slug',
            'reviewer:id,first_name,last_name',
        ]);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', $request->boolean('featured'));
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->where('article_category_id', $categoryId);
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(fn (Builder $q) => $q
                ->where('title', 'ilike', $like)
                ->orWhere('excerpt', 'ilike', $like)
                ->orWhereHas('author', fn (Builder $a) => $a
                    ->where('first_name', 'ilike', $like)
                    ->orWhere('last_name', 'ilike', $like)));
        }

        // Pending review first: a moderation queue should open on the work
        // waiting to be done. The id tiebreaker keeps the order stable —
        // Postgres gives no order among equal rows, and an UPDATE moves the
        // row to the heap end.
        $query->orderByRaw('case when status = ? then 0 else 1 end', [Article::STATUS_PENDING_REVIEW])
            ->latest('created_at')
            ->orderByDesc('id');

        $perPage = min(100, max(1, $request->integer('per_page', 15)));
        $articles = $query->paginate($perPage);

        return response()->json([
            'data' => collect($articles->items())
                ->map(fn (Article $article) => $this->transform($article))
                ->all(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        $this->authorize('approve', Article::class);

        $byStatus = Article::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $byStatus->sum();

        return response()->json([
            'data' => [
                'stats' => [
                    'total' => $total,
                    'published' => (int) ($byStatus[Article::STATUS_PUBLISHED] ?? 0),
                    'draft' => (int) ($byStatus[Article::STATUS_DRAFT] ?? 0),
                    'pending_review' => (int) ($byStatus[Article::STATUS_PENDING_REVIEW] ?? 0),
                    'scheduled' => (int) ($byStatus[Article::STATUS_SCHEDULED] ?? 0),
                    'rejected' => (int) ($byStatus[Article::STATUS_REJECTED] ?? 0),
                    'featured' => Article::query()->where('is_featured', true)->count(),
                    'views' => (int) Article::query()->sum('views_count'),
                ],
                'donut' => $this->donut($byStatus, $total),
            ],
        ]);
    }

    public function show(Article $article): JsonResponse
    {
        // Any article, published or not — hence the moderation gate.
        $this->authorize('approve', Article::class);

        $article->load([
            'author:id,first_name,last_name,email',
            'category:id,name,slug',
            'reviewer:id,first_name,last_name',
        ]);

        return response()->json(['data' => $this->transform($article, detailed: true)]);
    }

    /** Publishes an article that was waiting for review. */
    public function approve(Request $request, Article $article): JsonResponse
    {
        $this->authorize('approve', Article::class);

        if ($article->status === Article::STATUS_PUBLISHED) {
            throw ValidationException::withMessages([
                'status' => ['This article is already published.'],
            ]);
        }

        $article->update([
            'status' => Article::STATUS_PUBLISHED,
            // Set on approval rather than on submission: published_at orders
            // the public feed, and a piece held for a week should not appear
            // a week old the moment it goes live.
            'published_at' => now(),
            'reviewed_by' => $request->user()?->getKey(),
            'reviewed_at' => now(),
            'review_notes' => null,
        ]);

        $this->audit->log('articles', 'approved', "Approved article: {$article->title}", $article);

        return response()->json([
            'message' => 'Article published.',
            'data' => $this->transform($article->fresh(['author', 'category', 'reviewer'])),
        ]);
    }

    /**
     * Sends an article back to its author.
     *
     * Rejected rather than deleted, and the reason is stored on the article
     * itself rather than only in the audit log — the author has to be able to
     * read why, and fix it.
     */
    public function reject(Request $request, Article $article): JsonResponse
    {
        $this->authorize('approve', Article::class);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $article->update([
            'status' => Article::STATUS_REJECTED,
            'reviewed_by' => $request->user()?->getKey(),
            'reviewed_at' => now(),
            'review_notes' => $validated['reason'],
        ]);

        $this->audit->log(
            'articles',
            'rejected',
            "Rejected article {$article->title}: {$validated['reason']}",
            $article,
        );

        return response()->json([
            'message' => 'Article sent back to the author.',
            'data' => $this->transform($article->fresh(['author', 'category', 'reviewer'])),
        ]);
    }

    /**
     * Takes a published article off the feed.
     *
     * Back to draft rather than deleted: the author keeps their work, and the
     * piece can be corrected and resubmitted.
     */
    public function unpublish(Request $request, Article $article): JsonResponse
    {
        $this->authorize('approve', Article::class);

        if ($article->status !== Article::STATUS_PUBLISHED) {
            throw ValidationException::withMessages([
                'status' => ['Only a published article can be unpublished.'],
            ]);
        }

        $article->update([
            'status' => Article::STATUS_DRAFT,
            'published_at' => null,
            'reviewed_by' => $request->user()?->getKey(),
            'reviewed_at' => now(),
        ]);

        $this->audit->log('articles', 'updated', "Unpublished article: {$article->title}", $article);

        return response()->json([
            'message' => 'Article unpublished.',
            'data' => $this->transform($article->fresh(['author', 'category', 'reviewer'])),
        ]);
    }

    /** Toggles the homepage placement. */
    public function toggleFeatured(Article $article): JsonResponse
    {
        $this->authorize('approve', Article::class);

        $featured = ! $article->is_featured;
        $article->update(['is_featured' => $featured]);

        $this->audit->log(
            'articles',
            'updated',
            ($featured ? 'Featured' : 'Unfeatured')." article: {$article->title}",
            $article,
        );

        return response()->json([
            'message' => $featured ? 'Article featured.' : 'Article no longer featured.',
            'data' => $this->transform($article->fresh(['author', 'category', 'reviewer'])),
        ]);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        // An administrator's edit, not the author's — the policy refuses an
        // author outright once a piece is published, and before() lets an
        // administrator through.
        $this->authorize('update', $article);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'body' => ['sometimes', 'string'],
            'article_category_id' => ['sometimes', 'nullable', 'integer', 'exists:article_categories,id'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_sponsored' => ['sometimes', 'boolean'],
            'comments_enabled' => ['sometimes', 'boolean'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:320'],
            'status' => ['sometimes', Rule::in([
                Article::STATUS_DRAFT,
                Article::STATUS_PENDING_REVIEW,
                Article::STATUS_PUBLISHED,
                Article::STATUS_REJECTED,
            ])],
        ]);

        $article->update($validated);

        $this->audit->log('articles', 'updated', "Updated article: {$article->title}", $article);

        return response()->json([
            'message' => 'Article updated.',
            'data' => $this->transform($article->fresh(['author', 'category', 'reviewer'])),
        ]);
    }

    public function destroy(Article $article): JsonResponse
    {
        $this->authorize('delete', $article);

        $title = $article->title;

        // Soft delete: the public URL may be indexed and the view history is
        // worth keeping.
        $article->delete();

        $this->audit->log('articles', 'deleted', "Deleted article: {$title}");

        return response()->json(['message' => 'Article deleted.']);
    }

    /**
     * @param  Collection<string, int>  $byStatus
     * @return array<int, array<string, mixed>>
     */
    private function donut(Collection $byStatus, int $total): array
    {
        $colours = [
            Article::STATUS_PUBLISHED => ['Published', '#10b981'],
            Article::STATUS_PENDING_REVIEW => ['Pending Review', '#3b82f6'],
            Article::STATUS_DRAFT => ['Draft', '#f59e0b'],
            Article::STATUS_SCHEDULED => ['Scheduled', '#8b5cf6'],
            Article::STATUS_REJECTED => ['Rejected', '#ef4444'],
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
    private function transform(Article $article, bool $detailed = false): array
    {
        $base = [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'status' => $article->status,
            'is_featured' => $article->is_featured,
            'is_sponsored' => $article->is_sponsored,
            'reading_minutes' => $article->reading_minutes,
            'views_count' => $article->views_count,
            'comments_count' => $article->comments_count,
            'featured_image_path' => $article->featured_image_path,
            'published_at' => $article->published_at?->toIso8601String(),
            'created_at' => $article->created_at?->toIso8601String(),
            'reviewed_at' => $article->reviewed_at?->toIso8601String(),
            // The author needs to read why a piece came back, so the note
            // travels with the article rather than living only in the log.
            'review_notes' => $article->review_notes,
            'author' => $article->relationLoaded('author') && $article->author ? [
                'id' => $article->author->id,
                'name' => $article->author->full_name,
                'email' => $article->author->email,
            ] : null,
            'category' => $article->relationLoaded('category') && $article->category
                ? ['id' => $article->category->id, 'name' => $article->category->name, 'slug' => $article->category->slug]
                : null,
            'reviewer' => $article->relationLoaded('reviewer') && $article->reviewer
                ? ['id' => $article->reviewer->id, 'name' => $article->reviewer->full_name]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'body' => $article->body,
            'article_category_id' => $article->article_category_id,
            'comments_enabled' => $article->comments_enabled,
            'meta_title' => $article->meta_title,
            'meta_description' => $article->meta_description,
        ];
    }
}
