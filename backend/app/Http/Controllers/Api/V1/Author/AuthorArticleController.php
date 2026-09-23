<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Author;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * An author's own articles.
 *
 * Every read is scoped to the caller's authorship as well as checked by
 * ArticlePolicy. Scoping the query as well as the policy is deliberate: a
 * listing endpoint that returned everything and relied on a per-row check
 * would still leak other authors' drafts through counts and pagination.
 */
class AuthorArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /*
         * 'create', not 'viewAny'.
         *
         * A job seeker holds articles.view so they can read published pieces,
         * which would let them open the author workspace. The list is scoped
         * to authorship so nothing leaks, but an endpoint a seeker can reach
         * at all is one that will eventually be given something to show.
         */
        $this->authorize('create', Article::class);

        $query = Article::query()
            ->where('author_id', $request->user()?->getKey())
            ->with(['category:id,name,slug', 'reviewer:id,first_name,last_name']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(fn (Builder $q) => $q
                ->where('title', 'ilike', $like)
                ->orWhere('excerpt', 'ilike', $like));
        }

        // Rejected first: a piece sent back is the only thing here that needs
        // the author to act. The id tiebreaker keeps paging stable.
        $query->orderByRaw('case when status = ? then 0 else 1 end', [Article::STATUS_REJECTED])
            ->latest('created_at')
            ->orderByDesc('id');

        $perPage = min(50, max(1, $request->integer('per_page', 15)));
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

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('create', Article::class);

        $authorId = $request->user()?->getKey();

        $byStatus = Article::query()
            ->where('author_id', $authorId)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $totals = Article::query()
            ->where('author_id', $authorId)
            ->selectRaw('coalesce(sum(views_count), 0) as views, coalesce(sum(comments_count), 0) as comments')
            ->first();

        return response()->json([
            'data' => [
                'total' => (int) $byStatus->sum(),
                'published' => (int) ($byStatus[Article::STATUS_PUBLISHED] ?? 0),
                'draft' => (int) ($byStatus[Article::STATUS_DRAFT] ?? 0),
                'pending_review' => (int) ($byStatus[Article::STATUS_PENDING_REVIEW] ?? 0),
                'rejected' => (int) ($byStatus[Article::STATUS_REJECTED] ?? 0),
                'scheduled' => (int) ($byStatus[Article::STATUS_SCHEDULED] ?? 0),
                /*
                 * Views and comments only.
                 *
                 * The design also asked for likes and bookmarks, but neither
                 * table exists — there is nothing to count, and a figure the
                 * platform cannot produce is worse than none.
                 */
                'views' => (int) ($totals->views ?? 0),
                'comments' => (int) ($totals->comments ?? 0),
            ],
        ]);
    }

    public function show(Article $article): JsonResponse
    {
        $this->authorize('view', $article);

        // Tags too: the edit form pre-selects them, and an unloaded relation
        // transforms to an empty list, which would silently clear them.
        $article->load([
            'category:id,name,slug',
            'reviewer:id,first_name,last_name',
            'tags:id,name,slug',
        ]);

        return response()->json(['data' => $this->transform($article, detailed: true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Article::class);

        $validated = $this->validated($request);

        $publishing = ($validated['status'] ?? Article::STATUS_DRAFT) !== Article::STATUS_DRAFT;

        $validated = $this->withFeaturedImage($request, $validated);

        $article = Article::query()->create($this->attributes($validated) + [
            'author_id' => $request->user()?->getKey(),
            'slug' => $this->slug($validated['title']),
            /*
             * An author never publishes directly. The plan gates articles on
             * approval — articles_require_approval is on in settings, unlike
             * jobs — so submitting means asking for review.
             */
            'status' => $publishing ? $this->statusForSubmission() : Article::STATUS_DRAFT,
            'published_at' => $publishing && ! $this->requiresApproval() ? now() : null,
            'reading_minutes' => $this->readingMinutes($validated['body'] ?? ''),
            // Paid and editorial placements are a moderator's decision.
            'is_featured' => false,
            'is_sponsored' => false,
        ]);

        return response()->json([
            'message' => match ($article->status) {
                Article::STATUS_PUBLISHED => 'Article published.',
                Article::STATUS_PENDING_REVIEW => 'Article submitted for review.',
                default => 'Article saved as a draft.',
            },
            'data' => $this->transform(
                $this->syncTags($article, $validated)->fresh(['category', 'reviewer', 'tags']),
                detailed: true,
            ),
        ], 201);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        // The policy refuses an author outright once a piece is published:
        // editing after approval would let them get an innocuous article
        // through review and then rewrite it.
        $this->authorize('update', $article);

        $validated = $this->withFeaturedImage($request, $this->validated($request), $article);

        $attributes = $this->attributes($validated);

        if (array_key_exists('body', $validated)) {
            $attributes['reading_minutes'] = $this->readingMinutes($validated['body']);
        }

        // Resubmitting clears the previous rejection, so the author does not
        // keep seeing a note they have already acted on.
        if (($validated['status'] ?? null) === Article::STATUS_PENDING_REVIEW) {
            $attributes['status'] = $this->statusForSubmission();
            $attributes['review_notes'] = null;
        } elseif (($validated['status'] ?? null) === Article::STATUS_DRAFT) {
            $attributes['status'] = Article::STATUS_DRAFT;
        }

        $article->update($attributes);
        $this->syncTags($article, $validated);

        return response()->json([
            'message' => $article->status === Article::STATUS_PENDING_REVIEW
                ? 'Article submitted for review.'
                : 'Article updated.',
            'data' => $this->transform(
                $article->fresh(['category', 'reviewer', 'tags']),
                detailed: true,
            ),
        ]);
    }

    public function destroy(Article $article): JsonResponse
    {
        $this->authorize('delete', $article);

        $article->delete();

        return response()->json(['message' => 'Article deleted.']);
    }

    /** @return array<string, mixed> */
    /**
     * Resolves the uploaded image into the attribute the model stores.
     *
     * Three cases, and the difference matters: a file replaces the image,
     * remove_featured_image clears it, and neither means leave whatever is
     * there alone — an edit that does not touch the picture must not wipe it.
     *
     * The previous file is deleted once its replacement is in place, so
     * editing a piece repeatedly does not leave orphans on disk.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withFeaturedImage(Request $request, array $data, ?Article $article = null): array
    {
        // Not columns — they exist only to say what to do with the file.
        unset($data['featured_image'], $data['remove_featured_image']);

        $previous = $article?->featured_image_path;

        if ($request->hasFile('featured_image')) {
            $data['featured_image_path'] = $request
                ->file('featured_image')
                ->store('articles', 'public');

            if ($previous !== null) {
                Storage::disk('public')->delete($previous);
            }

            return $data;
        }

        if ($request->boolean('remove_featured_image')) {
            $data['featured_image_path'] = null;
            $data['featured_image_alt'] = null;

            if ($previous !== null) {
                Storage::disk('public')->delete($previous);
            }
        }

        return $data;
    }

    /**
     * Attaches the chosen tags, when the request mentioned them at all.
     *
     * A request that omits tags leaves the existing ones alone; sending an
     * empty array is how they are cleared. Syncing unconditionally would
     * strip every tag from any edit that did not resend them.
     *
     * @param  array<string, mixed>  $data
     */
    private function syncTags(Article $article, array $data): Article
    {
        if (array_key_exists('tags', $data)) {
            $article->tags()->sync($data['tags'] ?? []);
        }

        return $article;
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => [$request->isMethod('POST') ? 'required' : 'sometimes', 'string', 'max:200'],
            'body' => [$request->isMethod('POST') ? 'required' : 'sometimes', 'string', 'min:100'],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            'article_category_id' => ['sometimes', 'nullable', 'integer', 'exists:article_categories,id'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:320'],
            'comments_enabled' => ['sometimes', 'boolean'],

            /*
             * The article's lead image. Optional: a piece without one falls
             * back to a photo chosen from its category, which is what every
             * article showed before this field was reachable.
             *
             * 'image' restricts this to real image types rather than
             * trusting the extension. 4MB, in kilobytes: a photograph
             * straight off a phone routinely passes 2MB, and an author
             * should not have to resize one before writing.
             */
            'featured_image' => ['sometimes', 'nullable', 'file', 'image', 'max:4096'],
            'featured_image_alt' => ['sometimes', 'nullable', 'string', 'max:200'],
            // Sent to clear an existing image without replacing it; an absent
            // file means "leave it alone", which is what an edit that does
            // not touch the picture has to mean.
            'remove_featured_image' => ['sometimes', 'boolean'],

            // Existing tags only — an author picks from the taxonomy rather
            // than inventing entries in it.
            'tags' => ['sometimes', 'array', 'max:10'],
            'tags.*' => ['integer', 'exists:tags,id'],
            // Draft or submit. Published, rejected and scheduled are decided
            // by a moderator, never asked for here.
            'status' => ['sometimes', Rule::in([
                Article::STATUS_DRAFT,
                Article::STATUS_PENDING_REVIEW,
            ])],
        ], [
            'body.min' => 'Give readers a real article — at least 100 characters.',
        ]);
    }

    /**
     * Fields an author may set, separated from the ones they may not.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributes(array $data): array
    {
        $attributes = [];

        /*
         * featured_image_path is resolved from the upload before this runs,
         * and belongs in the list for the same reason as the rest: a key
         * missing from it is dropped silently, so the file would reach disk
         * and the column would stay null.
         *
         * array_key_exists rather than isset throughout, so an explicit null
         * — clearing the image — is written instead of skipped.
         */
        foreach ([
            'title', 'body', 'excerpt', 'article_category_id',
            'featured_image_path', 'featured_image_alt',
            'meta_title', 'meta_description', 'comments_enabled',
        ] as $field) {
            if (array_key_exists($field, $data)) {
                $attributes[$field] = $data[$field];
            }
        }

        return $attributes;
    }

    private function requiresApproval(): bool
    {
        return (bool) Setting::value('articles_require_approval', true);
    }

    private function statusForSubmission(): string
    {
        return $this->requiresApproval()
            ? Article::STATUS_PENDING_REVIEW
            : Article::STATUS_PUBLISHED;
    }

    /** Roughly 200 words a minute, which is the usual reading estimate. */
    private function readingMinutes(string $body): int
    {
        return max(1, (int) ceil(str_word_count(strip_tags($body)) / 200));
    }

    /**
     * A slug that stays unique without a lookup loop.
     *
     * The suffix is what lets two pieces with the same title both be
     * addressable, as the seeded data already shows.
     */
    private function slug(string $title): string
    {
        return Str::slug($title).'-'.Str::lower(Str::random(4));
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
            'reading_minutes' => $article->reading_minutes,
            'views_count' => $article->views_count,
            'comments_count' => $article->comments_count,
            'published_at' => $article->published_at?->toIso8601String(),
            'created_at' => $article->created_at?->toIso8601String(),
            'reviewed_at' => $article->reviewed_at?->toIso8601String(),
            // Why a piece came back. The author has to be able to read it.
            'review_notes' => $article->review_notes,
            'category' => $article->relationLoaded('category') && $article->category
                ? ['id' => $article->category->id, 'name' => $article->category->name]
                : null,
            'reviewer' => $article->relationLoaded('reviewer') && $article->reviewer
                ? ['name' => $article->reviewer->full_name]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'body' => $article->body,
            'article_category_id' => $article->article_category_id,
            'featured_image_path' => $article->featured_image_path,
            'featured_image_alt' => $article->featured_image_alt,
            // Ids, not names: the form pre-selects from them.
            'tags' => $article->relationLoaded('tags')
                ? $article->tags->pluck('id')->all()
                : [],
            'comments_enabled' => $article->comments_enabled,
            'meta_title' => $article->meta_title,
            'meta_description' => $article->meta_description,
        ];
    }
}
