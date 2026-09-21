<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Company;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Everything the homepage needs, in one request.
 *
 * One endpoint rather than six: the homepage is server-rendered and a
 * crawler's first impression, so six sequential round trips would be six
 * chances to be slow. The whole payload is cached — none of it changes
 * minute to minute.
 */
class HomeController extends Controller
{
    /** Long enough to matter, short enough that a new job appears promptly. */
    private const CACHE_SECONDS = 300;

    public function __invoke(): JsonResponse
    {
        $data = cache()->remember('home.payload', self::CACHE_SECONDS, fn () => [
            'stats' => $this->stats(),
            'categories' => $this->categories(),
            'featured_jobs' => $this->featuredJobs(),
            'companies' => $this->companies(),
            'articles' => $this->articles(),
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * The counters across the hero.
     *
     * Counted live rather than stored: a homepage claiming a job count that
     * disagrees with the board is worse than no counter at all.
     *
     * @return array<string, int>
     */
    private function stats(): array
    {
        return [
            'jobs' => Job::query()->where('status', Job::STATUS_PUBLISHED)->count(),
            'companies' => Company::query()->active()->count(),
            'countries' => (int) Job::query()
                ->where('status', Job::STATUS_PUBLISHED)
                ->distinct()
                ->count('country_id'),
            'articles' => Article::query()->where('status', Article::STATUS_PUBLISHED)->count(),
        ];
    }

    /**
     * Top-level categories with a live count of open roles.
     *
     * Jobs attach to a leaf category (e.g. "Petroleum Engineering"), never
     * to its parent group (e.g. "Engineering") directly, so a tile's count
     * has to sum every child under it — counting only jobs.job_category_id
     * matches against the parent row would show every group as empty.
     *
     * Only featured parents are eligible: is_featured is the admin's own
     * on/off switch for this list, not a suggestion — unchecking it should
     * take the tile off the homepage regardless of how many jobs sit under
     * it. The count is still what makes a featured tile worth clicking, so
     * one leading to an empty board is left out too.
     *
     * @return array<int, array<string, mixed>>
     */
    private function categories(): array
    {
        return DB::table('job_categories as parent')
            ->leftJoin('job_categories as child', function ($join) {
                $join->on('child.parent_id', '=', 'parent.id')
                    ->whereNull('child.deleted_at')
                    ->where('child.is_active', true);
            })
            ->leftJoin('jobs', function ($join) {
                $join->on('jobs.job_category_id', '=', DB::raw('coalesce(child.id, parent.id)'))
                    ->where('jobs.status', '=', Job::STATUS_PUBLISHED)
                    ->whereNull('jobs.deleted_at');
            })
            ->whereNull('parent.parent_id')
            ->where('parent.is_active', true)
            ->where('parent.is_featured', true)
            ->whereNull('parent.deleted_at')
            ->selectRaw('parent.name, parent.slug, parent.emoji, parent.color, count(jobs.id) as jobs_count')
            ->groupBy('parent.id', 'parent.name', 'parent.slug', 'parent.emoji', 'parent.color')
            ->havingRaw('count(jobs.id) > 0')
            ->orderByDesc('jobs_count')
            ->orderBy('parent.name')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'slug' => $row->slug,
                'emoji' => $row->emoji,
                'color' => $row->color,
                'jobs_count' => (int) $row->jobs_count,
            ])
            ->all();
    }

    /**
     * The jobs shown on the homepage.
     *
     * Featured first, then the newest. Falling back to recent listings rather
     * than requiring featured ones is deliberate: featured placement is sold,
     * so a new board has none, and an empty homepage section would be the
     * first thing every visitor saw.
     *
     * @return array<int, array<string, mixed>>
     */
    private function featuredJobs(): array
    {
        return Job::query()
            ->where('status', Job::STATUS_PUBLISHED)
            ->with(['company:id,name,slug,logo_path', 'category:id,name,slug', 'country:id,name,code,flag_emoji', 'city:id,name'])
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(fn (Job $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'employment_type' => $job->employment_type,
                'is_remote' => $job->is_remote,
                'is_featured' => $job->is_featured,
                'is_urgent' => $job->is_urgent,
                'location_label' => $job->location_label,
                'published_at' => $job->published_at?->toIso8601String(),
                // Salary is omitted entirely when hidden, rather than sent and
                // trusted to the frontend not to render it.
                'salary_min' => $job->salary_is_hidden ? null : $job->salary_min,
                'salary_max' => $job->salary_is_hidden ? null : $job->salary_max,
                'salary_currency' => $job->salary_is_hidden ? null : $job->salary_currency,
                'salary_period' => $job->salary_is_hidden ? null : $job->salary_period,
                'company' => $job->company ? [
                    'name' => $job->company->name,
                    'slug' => $job->company->slug,
                    'logo_path' => $job->company->logo_path,
                ] : null,
                'category' => $job->category ? ['name' => $job->category->name, 'slug' => $job->category->slug] : null,
                'country' => $job->country ? ['name' => $job->country->name, 'code' => $job->country->code] : null,
                'city' => $job->city ? ['name' => $job->city->name] : null,
            ])
            ->all();
    }

    /**
     * Companies worth showing: the ones actually hiring.
     *
     * @return array<int, array<string, mixed>>
     */
    private function companies(): array
    {
        return Company::query()
            ->active()
            ->has('publishedJobs')
            ->withCount('publishedJobs')
            ->orderByDesc('is_featured')
            ->orderByDesc('published_jobs_count')
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn (Company $company) => [
                'name' => $company->name,
                'slug' => $company->slug,
                'logo_path' => $company->logo_path,
                'is_verified' => $company->is_verified,
                'open_jobs' => $company->published_jobs_count ?? 0,
            ])
            ->all();
    }

    /**
     * The latest published articles.
     *
     * @return array<int, array<string, mixed>>
     */
    private function articles(): array
    {
        return Article::query()
            ->where('status', Article::STATUS_PUBLISHED)
            ->where('published_at', '<=', now())
            ->with(['author:id,first_name,last_name', 'category:id,name,slug'])
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn (Article $article) => [
                'title' => $article->title,
                'slug' => $article->slug,
                'excerpt' => $article->excerpt,
                'reading_minutes' => $article->reading_minutes,
                'published_at' => $article->published_at?->toIso8601String(),
                'author' => $article->author ? ['name' => $article->author->full_name] : null,
                'category' => $article->category ? ['name' => $article->category->name, 'slug' => $article->category->slug] : null,
            ])
            ->all();
    }
}
