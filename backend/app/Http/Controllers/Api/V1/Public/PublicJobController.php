<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Job search and detail for the public site.
 *
 * Open to guests by design: the plan lets anyone search jobs, read articles
 * and browse companies, and closes only applying and posting. Search also has
 * to work signed-out for the crawlers the SEO plan depends on.
 *
 * Only published, unexpired jobs are ever returned. A draft or closed job is
 * absent rather than forbidden — its existence is not public information.
 */
class PublicJobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Job::query()
            ->published()
            ->notExpired()
            ->with([
                'company:id,name,slug,logo_path,is_verified',
                'category:id,name,slug',
                'industry:id,name,slug',
                'country:id,name,slug,code,flag_emoji',
                'city:id,name,slug',
            ]);

        $this->applyFilters($query, $request);
        $this->applySort($query, $request);

        $perPage = min(50, max(1, $request->integer('per_page', 15)));
        $jobs = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => collect($jobs->items())->map(fn (Job $job) => $this->summary($job))->all(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /**
     * A single job by slug.
     *
     * Resolved by slug rather than id because the plan asks for SEO URLs, and
     * an id in the address bar would leak how many jobs exist.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $job = Job::query()
            ->published()
            ->notExpired()
            ->with([
                'company:id,name,slug,logo_path,cover_path,website,description,is_verified',
                'category:id,name,slug',
                'industry:id,name,slug',
                'country:id,name,slug,code,flag_emoji',
                'city:id,name,slug',
                'skills:id,name,slug',
                'tags:id,name,slug,color',
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        $this->recordView($job, $request);

        return response()->json(['data' => $this->detail($job)]);
    }

    /**
     * The apply destination, shown up front to a signed-in job seeker.
     *
     * Separate from show() because that response is cached by the frontend's
     * server-side fetch, which never carries the visitor's session cookie —
     * baking this into show() would mean either every visitor sees it or
     * none do, whichever request happened to fill the cache. This endpoint
     * is called from the browser instead, where the session cookie is
     * actually present, so it correctly varies per signed-in visitor.
     *
     * Unlike the apply endpoint, this does not record a click — it only
     * previews the destination.
     */
    public function applyTarget(Request $request, string $slug): JsonResponse
    {
        if ($request->user() === null) {
            return response()->json(['data' => null]);
        }

        $job = Job::query()->published()->notExpired()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => [
                'apply_method' => $job->apply_method,
                'apply_email' => $job->apply_method === Job::APPLY_EMAIL ? $job->apply_email : null,
                'apply_url' => $job->apply_method === Job::APPLY_EXTERNAL_URL ? $job->apply_url : null,
            ],
        ]);
    }

    /**
     * Jobs like this one, for the "related" strip on the detail page.
     */
    public function related(string $slug): JsonResponse
    {
        $job = Job::query()->published()->where('slug', $slug)->firstOrFail();

        $related = Job::query()
            ->published()
            ->notExpired()
            ->whereKeyNot($job->getKey())
            ->where(function (Builder $query) use ($job) {
                $query->where('job_category_id', $job->job_category_id)
                    ->orWhere('industry_id', $job->industry_id)
                    ->orWhere('country_id', $job->country_id);
            })
            ->with([
                'company:id,name,slug,logo_path,is_verified',
                'country:id,name,code,flag_emoji',
                'city:id,name',
            ])
            // Same category first, then anything else that matched.
            ->orderByRaw('case when job_category_id = ? then 0 else 1 end', [$job->job_category_id])
            ->latest('published_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        return response()->json([
            'data' => $related->map(fn (Job $j) => $this->summary($j))->all(),
        ]);
    }

    /** @param  Builder<Job>  $query */
    private function applyFilters(Builder $query, Request $request): void
    {
        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(function (Builder $q) use ($like) {
                $q->where('title', 'ilike', $like)
                    ->orWhere('location_label', 'ilike', $like)
                    ->orWhereHas('company', fn (Builder $c) => $c->where('name', 'ilike', $like));
            });
        }

        // Slugs rather than ids: they are what appears in a shareable URL.
        foreach ([
            'country' => 'country',
            'city' => 'city',
            'industry' => 'industry',
        ] as $param => $relation) {
            if ($slug = $request->string($param)->toString()) {
                $query->whereHas($relation, fn (Builder $q) => $q->where('slug', $slug));
            }
        }

        /*
         * Category is matched by slug too, but a job's category is always a
         * leaf (e.g. "Petroleum Engineering"), never the parent group (e.g.
         * "Engineering") it sits under. Filtering by a parent's slug has to
         * match every job whose category is one of that parent's children,
         * not just a category row with that exact slug.
         */
        if ($categorySlug = $request->string('category')->toString()) {
            $category = JobCategory::query()->where('slug', $categorySlug)->first(['id', 'parent_id']);

            if ($category === null) {
                $query->whereRaw('1 = 0');
            } elseif ($category->parent_id === null) {
                $query->whereHas('category', fn (Builder $q) => $q
                    ->where('id', $category->id)
                    ->orWhere('parent_id', $category->id));
            } else {
                $query->where('job_category_id', $category->id);
            }
        }

        if ($type = $request->string('employment_type')->toString()) {
            $query->where('employment_type', $type);
        }

        if ($request->boolean('remote')) {
            $query->where('is_remote', true);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // Experience is a range on the job: "3-5 years". A candidate with 4
        // years should match, so the filter tests overlap rather than equality.
        if ($request->filled('experience_min')) {
            $query->where(function (Builder $q) use ($request) {
                $q->whereNull('experience_max')
                    ->orWhere('experience_max', '>=', $request->integer('experience_min'));
            });
        }

        if ($request->filled('experience_max')) {
            $query->where(function (Builder $q) use ($request) {
                $q->whereNull('experience_min')
                    ->orWhere('experience_min', '<=', $request->integer('experience_max'));
            });
        }

        // Jobs that hide their salary are excluded from a salary filter: they
        // cannot be judged against it, and showing them anyway would make the
        // filter look broken.
        if ($request->filled('salary_min')) {
            $query->where('salary_is_hidden', false)
                ->where('salary_max', '>=', $request->integer('salary_min'));
        }

        if ($slug = $request->string('skill')->toString()) {
            $query->whereHas('skills', fn (Builder $q) => $q->where('slug', $slug));
        }

        if ($slug = $request->string('tag')->toString()) {
            $query->whereHas('tags', fn (Builder $q) => $q->where('tags.slug', $slug));
        }

        if ($slug = $request->string('company')->toString()) {
            $query->whereHas('company', fn (Builder $q) => $q->where('slug', $slug));
        }
    }

    /** @param  Builder<Job>  $query */
    private function applySort(Builder $query, Request $request): void
    {
        // Featured jobs lead every ordering — that is what the placement is
        // sold for — but never at the cost of the chosen sort within them.
        $query->orderByDesc('is_featured');

        match ($request->string('sort')->toString()) {
            'salary' => $query->orderByDesc('salary_max'),
            'views' => $query->orderByDesc('views_count'),
            default => $query->orderByDesc('published_at'),
        };

        // Total order, so paging cannot repeat or skip a job when several
        // share a published_at.
        $query->orderByDesc('id');
    }

    /**
     * Counts a view, at most once per visitor per job per day.
     *
     * Without the guard a refresh would inflate the figure the employer sees,
     * and views_count is what the analytics in the plan report on.
     */
    private function recordView(Job $job, Request $request): void
    {
        $visitor = $request->user()?->getKey() ?? $request->ip();
        $key = "job-view:{$job->getKey()}:".sha1((string) $visitor);

        if (cache()->has($key)) {
            return;
        }

        cache()->put($key, true, now()->endOfDay());

        $job->increment('views_count');

        $job->views()->create([
            'user_id' => $request->user()?->getKey(),
            'visitor_hash' => sha1((string) $visitor),
            'ip_address' => $request->ip(),
            'referrer' => $request->headers->get('referer'),
            'viewed_at' => now(),
        ]);
    }

    /**
     * The fields a job card needs. Deliberately smaller than the detail
     * payload: a 15-job page should not ship fifteen full descriptions.
     *
     * @return array<string, mixed>
     */
    private function summary(Job $job): array
    {
        return [
            'id' => $job->id,
            'title' => $job->title,
            'slug' => $job->slug,
            'employment_type' => $job->employment_type,
            'is_remote' => $job->is_remote,
            'is_featured' => $job->is_featured,
            'is_urgent' => $job->is_urgent,
            'location_label' => $job->location_label,
            'experience_min' => $job->experience_min,
            'experience_max' => $job->experience_max,
            'salary' => $this->salary($job),
            'published_at' => $job->published_at?->toIso8601String(),
            'deadline_at' => $job->deadline_at?->toIso8601String(),
            'views_count' => $job->views_count,
            'company' => $job->relationLoaded('company') && $job->company ? [
                'name' => $job->company->name,
                'slug' => $job->company->slug,
                'logo_path' => $job->company->logo_path,
                'is_verified' => $job->company->is_verified,
            ] : null,
            'category' => $this->named($job, 'category'),
            'industry' => $this->named($job, 'industry'),
            'country' => $job->relationLoaded('country') && $job->country ? [
                'name' => $job->country->name,
                'slug' => $job->country->slug,
                'code' => $job->country->code,
                'flag_emoji' => $job->country->flag_emoji,
            ] : null,
            'city' => $this->named($job, 'city'),
        ];
    }

    /** @return array<string, mixed> */
    private function detail(Job $job): array
    {
        return $this->summary($job) + [
            'reference' => $job->reference,
            'description' => $job->description,
            'responsibilities' => $job->responsibilities,
            'requirements' => $job->requirements,
            'benefits' => $job->benefits,

            /*
             * How to apply, but never where here. This response is cached by
             * the frontend's server-side fetch with no session attached, so
             * it cannot vary per visitor — the actual destination is fetched
             * separately, client-side, by applyTarget() below, which does see
             * the visitor's session and is never cached.
             */
            'apply_method' => $job->apply_method,

            'skills' => $job->relationLoaded('skills')
                ? $job->skills->map(fn ($s) => ['name' => $s->name, 'slug' => $s->slug])->all()
                : [],
            'tags' => $job->relationLoaded('tags')
                ? $job->tags->map(fn ($t) => [
                    'name' => $t->name,
                    'slug' => $t->slug,
                    'color' => $t->color,
                ])->all()
                : [],
            'company_profile' => $job->relationLoaded('company') && $job->company ? [
                'website' => $job->company->website,
                'description' => $job->company->description,
                'cover_path' => $job->company->cover_path,
            ] : null,
            'meta_title' => $job->meta_title ?: $job->title,
            'meta_description' => $job->meta_description,
        ];
    }

    /**
     * Salary as the site should show it, or null when the employer chose to
     * withhold it — in which case no bound is exposed at all.
     *
     * @return array<string, mixed>|null
     */
    private function salary(Job $job): ?array
    {
        if ($job->salary_is_hidden || ($job->salary_min === null && $job->salary_max === null)) {
            return null;
        }

        return [
            'min' => $job->salary_min,
            'max' => $job->salary_max,
            'currency' => $job->salary_currency,
            'period' => $job->salary_period,
        ];
    }

    /** @return array<string, string>|null */
    private function named(Job $job, string $relation): ?array
    {
        if (! $job->relationLoaded($relation) || ! $job->{$relation}) {
            return null;
        }

        return [
            'name' => $job->{$relation}->name,
            'slug' => $job->{$relation}->slug,
        ];
    }
}
