<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Job;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The public company directory.
 *
 * Open to guests, like the job board: the plan lets anyone browse companies,
 * and these pages carry the SEO a crawler arrives for with no session.
 *
 * Only active companies appear. A pending, suspended or inactive company is
 * absent entirely rather than shown without its listings — a suspended
 * employer's page staying up would defeat the suspension.
 */
class PublicCompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()
            ->active()
            ->with(['industry:id,name,slug', 'country:id,name,code,flag_emoji', 'city:id,name'])
            /*
             * Counted live rather than read from companies.jobs_count, which
             * is a denormalised column that has already drifted. It also has
             * to count published jobs only — the stored figure includes
             * drafts and expired listings a visitor cannot see.
             */
            ->withCount('publishedJobs');

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(fn (Builder $q) => $q
                ->where('name', 'ilike', $like)
                ->orWhere('description', 'ilike', $like));
        }

        if ($industry = $request->string('industry')->toString()) {
            $query->whereHas('industry', fn (Builder $i) => $i->where('slug', $industry));
        }

        if ($country = $request->string('country')->toString()) {
            $query->whereHas('country', fn (Builder $c) => $c->where('code', $country));
        }

        if ($request->boolean('hiring')) {
            $query->has('publishedJobs');
        }

        // Featured first, then the companies actually hiring, then verified.
        // A directory sorted by name alone buries every employer with a live
        // vacancy behind whoever is first alphabetically.
        $query->orderByDesc('is_featured')
            ->orderByDesc('published_jobs_count')
            ->orderByDesc('is_verified')
            ->orderBy('name')
            ->orderBy('id');

        $perPage = min(50, max(1, $request->integer('per_page', 12)));
        $companies = $query->paginate($perPage);

        return response()->json([
            'data' => collect($companies->items())
                ->map(fn (Company $company) => $this->transform($company))
                ->all(),
            'meta' => [
                'current_page' => $companies->currentPage(),
                'last_page' => $companies->lastPage(),
                'per_page' => $companies->perPage(),
                'total' => $companies->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $company = Company::query()
            ->active()
            ->where('slug', $slug)
            ->with([
                'industry:id,name,slug',
                'country:id,name,code,flag_emoji',
                'city:id,name',
                'socials:id,company_id,platform,url',
            ])
            ->withCount('publishedJobs')
            ->firstOrFail();

        return response()->json(['data' => $this->transform($company, detailed: true)]);
    }

    /** The company's live vacancies, for its profile page. */
    public function jobs(Request $request, string $slug): JsonResponse
    {
        $company = Company::query()->active()->where('slug', $slug)->firstOrFail();

        $query = Job::query()
            ->where('company_id', $company->getKey())
            ->where('status', Job::STATUS_PUBLISHED)
            ->with([
                'category:id,name,slug',
                'country:id,name,code,flag_emoji',
                'city:id,name',
            ])
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $perPage = min(50, max(1, $request->integer('per_page', 10)));
        $jobs = $query->paginate($perPage);

        return response()->json([
            'data' => collect($jobs->items())->map(fn (Job $job) => [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'employment_type' => $job->employment_type,
                'is_remote' => $job->is_remote,
                'is_featured' => $job->is_featured,
                'location_label' => $job->location_label,
                'published_at' => $job->published_at?->toIso8601String(),
                'deadline_at' => $job->deadline_at?->toIso8601String(),
                'category' => $job->relationLoaded('category') && $job->category
                    ? ['name' => $job->category->name, 'slug' => $job->category->slug]
                    : null,
                'country' => $job->relationLoaded('country') && $job->country
                    ? ['name' => $job->country->name, 'code' => $job->country->code]
                    : null,
                'city' => $job->relationLoaded('city') && $job->city
                    ? ['name' => $job->city->name]
                    : null,
            ])->all(),
            'meta' => [
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
                'per_page' => $jobs->perPage(),
                'total' => $jobs->total(),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function transform(Company $company, bool $detailed = false): array
    {
        $base = [
            'id' => $company->id,
            'name' => $company->name,
            'slug' => $company->slug,
            'website' => $company->website,
            'logo_path' => $company->logo_path,
            'company_size' => $company->company_size,
            'founded_year' => $company->founded_year,
            'is_verified' => $company->is_verified,
            'is_featured' => $company->is_featured,
            'open_jobs' => $company->published_jobs_count ?? 0,
            'industry' => $company->relationLoaded('industry') && $company->industry
                ? ['name' => $company->industry->name, 'slug' => $company->industry->slug]
                : null,
            'country' => $company->relationLoaded('country') && $company->country
                ? ['name' => $company->country->name, 'code' => $company->country->code]
                : null,
            'city' => $company->relationLoaded('city') && $company->city
                ? ['name' => $company->city->name]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'description' => $company->description,
            'address' => $company->address,
            'cover_path' => $company->cover_path,
            'meta_title' => $company->meta_title,
            'meta_description' => $company->meta_description,
            /*
             * Email and phone are deliberately absent.
             *
             * They belong to the company's own record, not its public page —
             * publishing them would turn the directory into a scraped contact
             * list. Candidates reach an employer through a job's apply route.
             */
            'socials' => $company->relationLoaded('socials')
                ? $company->socials->map(fn ($social) => [
                    'platform' => $social->platform,
                    'url' => $social->url,
                ])->all()
                : [],
        ];
    }
}
