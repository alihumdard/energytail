<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\City;
use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Job;
use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

/**
 * Every public URL, for the sitemap the frontend serves.
 *
 * A separate endpoint rather than paging the listing APIs: those cap at 50
 * per page and carry the full card payload, so a board of a few thousand jobs
 * would be dozens of round trips shipping descriptions nobody reads. This
 * returns slugs and timestamps only.
 *
 * The visibility rules are the same scopes the public pages use, not a
 * re-implementation. A sitemap that lists a URL which 404s is worse than no
 * sitemap — it teaches the crawler the site is unreliable — so the two must
 * not be able to drift apart.
 */
class SitemapController extends Controller
{
    /** Long enough to absorb crawler traffic, short enough that a new job is found the same day. */
    private const CACHE_SECONDS = 900;

    public function __invoke(): JsonResponse
    {
        /** @var array<string, mixed> $data */
        $data = cache()->remember('sitemap.payload', self::CACHE_SECONDS, fn (): array => [
            'jobs' => $this->jobs(),
            'companies' => $this->companies(),
            'articles' => $this->articles(),
            'taxonomies' => $this->taxonomies(),
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Published, unexpired jobs.
     *
     * lastmod is updated_at rather than published_at: an employer editing the
     * salary on a month-old listing has changed the page, and that is what
     * lastmod means.
     *
     * @return array<int, array<string, string|null>>
     */
    private function jobs(): array
    {
        return Job::query()
            ->published()
            ->notExpired()
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at'])
            ->map(fn (Job $job): array => [
                'slug' => $job->slug,
                'updated_at' => $job->updated_at?->toIso8601String(),
            ])
            ->all();
    }

    /** @return array<int, array<string, string|null>> */
    private function companies(): array
    {
        return Company::query()
            ->active()
            ->orderBy('name')
            ->get(['slug', 'updated_at'])
            ->map(fn (Company $company): array => [
                'slug' => $company->slug,
                'updated_at' => $company->updated_at?->toIso8601String(),
            ])
            ->all();
    }

    /** @return array<int, array<string, string|null>> */
    private function articles(): array
    {
        return Article::query()
            ->published()
            ->orderByDesc('published_at')
            ->get(['slug', 'updated_at'])
            ->map(fn (Article $article): array => [
                'slug' => $article->slug,
                'updated_at' => $article->updated_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * Filter slugs, for the landing pages the plan asks for
     * ("jobs in Norway", "drilling jobs").
     *
     * Only taxonomies that currently have at least one live job are listed.
     * An empty results page is a thin page, and volunteering thin pages to a
     * crawler costs more than the URL is worth.
     *
     * @return array<string, array<int, string>>
     */
    private function taxonomies(): array
    {
        return [
            'countries' => $this->withLiveJobs(Country::class, 'country_id'),
            'cities' => $this->withLiveJobs(City::class, 'city_id'),
            'categories' => $this->withLiveJobs(JobCategory::class, 'job_category_id'),
            'industries' => $this->withLiveJobs(Industry::class, 'industry_id'),
            'article_categories' => ArticleCategory::query()
                ->whereHas(
                    'articles',
                    function (Builder $q): void {
                        /** @var Builder<Article> $q */
                        $q->published();
                    }
                )
                ->orderBy('name')
                ->pluck('slug')
                ->all(),
        ];
    }

    /**
     * Slugs of a taxonomy that at least one published, unexpired job points at.
     *
     * @param  class-string<Model>  $model
     * @return array<int, string>
     */
    private function withLiveJobs(string $model, string $foreignKey): array
    {
        /** @var array<int, string> $slugs */
        $slugs = $model::query()
            ->whereIn(
                'id',
                Job::query()->published()->notExpired()->select($foreignKey)
            )
            ->orderBy('name')
            ->pluck('slug')
            ->all();

        return $slugs;
    }
}
