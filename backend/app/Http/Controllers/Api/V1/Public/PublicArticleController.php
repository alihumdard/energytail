<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The public article feed.
 *
 * Open to guests: the plan lets anyone read articles, and server-side
 * rendering of these pages is part of the SEO strategy — a crawler arrives
 * with no session.
 */
class PublicArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Article::query()
            /*
             * Published only, and never anything scheduled for the future.
             * The status alone is not enough: an approved piece with a future
             * published_at would otherwise appear before its date.
             */
            ->where('status', Article::STATUS_PUBLISHED)
            ->where('published_at', '<=', now())
            ->with(['author:id,first_name,last_name', 'category:id,name,slug']);

        if ($category = $request->string('category')->toString()) {
            $query->whereHas('category', fn (Builder $c) => $c->where('slug', $category));
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(fn (Builder $q) => $q
                ->where('title', 'ilike', $like)
                ->orWhere('excerpt', 'ilike', $like));
        }

        // Featured first, then newest. The id tiebreaker keeps paging stable
        // when several pieces share a publication date.
        $query->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $perPage = min(50, max(1, $request->integer('per_page', 12)));
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

    public function show(string $slug): JsonResponse
    {
        $article = Article::query()
            ->where('slug', $slug)
            ->where('status', Article::STATUS_PUBLISHED)
            ->where('published_at', '<=', now())
            ->with(['author:id,first_name,last_name', 'category:id,name,slug'])
            ->firstOrFail();

        // Counted directly rather than through the model so the read does not
        // touch updated_at — a view is not an edit.
        Article::query()->whereKey($article->getKey())->increment('views_count');

        return response()->json([
            'data' => $this->transform($article, detailed: true),
        ]);
    }

    /** More from the same category, for the foot of an article. */
    public function related(string $slug): JsonResponse
    {
        $article = Article::query()
            ->where('slug', $slug)
            ->where('status', Article::STATUS_PUBLISHED)
            ->firstOrFail();

        $related = Article::query()
            ->where('status', Article::STATUS_PUBLISHED)
            ->where('published_at', '<=', now())
            ->whereKeyNot($article->getKey())
            ->when(
                $article->article_category_id !== null,
                fn (Builder $q) => $q->where('article_category_id', $article->article_category_id),
            )
            ->with(['author:id,first_name,last_name', 'category:id,name,slug'])
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get();

        return response()->json([
            'data' => $related->map(fn (Article $a) => $this->transform($a))->all(),
        ]);
    }

    /** @return array<string, mixed> */
    private function transform(Article $article, bool $detailed = false): array
    {
        $base = [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'excerpt' => $article->excerpt,
            'featured_image_path' => $article->featured_image_path,
            'reading_minutes' => $article->reading_minutes,
            'views_count' => $article->views_count,
            'comments_count' => $article->comments_count,
            'is_featured' => $article->is_featured,
            'is_sponsored' => $article->is_sponsored,
            'published_at' => $article->published_at?->toIso8601String(),
            'author' => $article->relationLoaded('author') && $article->author
                ? ['name' => $article->author->full_name]
                : null,
            'category' => $article->relationLoaded('category') && $article->category
                ? ['name' => $article->category->name, 'slug' => $article->category->slug]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'body' => $article->body,
            'meta_title' => $article->meta_title,
            'meta_description' => $article->meta_description,
            'comments_enabled' => $article->comments_enabled,
        ];
    }
}
