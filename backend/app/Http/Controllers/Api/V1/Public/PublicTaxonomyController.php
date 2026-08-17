<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\ArticleCategory;
use App\Models\City;
use App\Models\Country;
use App\Models\Industry;
use App\Models\JobCategory;
use App\Models\Skill;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Read-only taxonomy for the public site: search filters, dropdowns and
 * category landing pages.
 *
 * Only active records are returned — deactivating an item in the admin panel
 * removes it from the frontend without deleting anything. Responses are
 * cached because this data changes rarely but is read on nearly every page.
 */
class PublicTaxonomyController extends Controller
{
    private const CACHE_MINUTES = 60;

    public function countries(): JsonResponse
    {
        $data = Cache::remember('public.countries', now()->addMinutes(self::CACHE_MINUTES),
            fn () => Country::active()->ordered()
                ->get(['id', 'name', 'slug', 'code', 'flag_emoji', 'region'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function cities(Request $request): JsonResponse
    {
        $countryId = $request->integer('country_id');

        // Keyed per country: the full city list is large, and the filter
        // sidebar only ever needs one country's worth at a time.
        $key = $countryId > 0 ? "public.cities.{$countryId}" : 'public.cities.all';

        $data = Cache::remember($key, now()->addMinutes(self::CACHE_MINUTES),
            fn () => City::active()->ordered()
                ->when($countryId > 0, fn ($q) => $q->where('country_id', $countryId))
                ->get(['id', 'country_id', 'name', 'slug', 'region'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function industries(): JsonResponse
    {
        $data = Cache::remember('public.industries', now()->addMinutes(self::CACHE_MINUTES),
            fn () => Industry::active()->ordered()
                ->get(['id', 'name', 'slug', 'emoji', 'color', 'description'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function jobCategories(): JsonResponse
    {
        $data = Cache::remember('public.job_categories', now()->addMinutes(self::CACHE_MINUTES),
            fn () => JobCategory::active()->ordered()
                ->get(['id', 'parent_id', 'name', 'slug', 'emoji', 'color', 'description', 'is_featured'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function articleCategories(): JsonResponse
    {
        $data = Cache::remember('public.article_categories', now()->addMinutes(self::CACHE_MINUTES),
            fn () => ArticleCategory::active()->ordered()
                ->get(['id', 'parent_id', 'name', 'slug', 'color'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function skills(Request $request): JsonResponse
    {
        $search = $request->string('search')->toString();

        // Search results are not cached: the term is unbounded, so caching
        // would fill the store with single-use entries.
        if ($search !== '') {
            return response()->json([
                'data' => Skill::active()
                    ->where('name', 'ilike', "%{$search}%")
                    ->ordered()->limit(25)
                    ->get(['id', 'name', 'slug', 'category'])
                    ->all(),
            ]);
        }

        $data = Cache::remember('public.skills', now()->addMinutes(self::CACHE_MINUTES),
            fn () => Skill::active()->ordered()
                ->get(['id', 'name', 'slug', 'category', 'demand_level'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    public function tags(): JsonResponse
    {
        $data = Cache::remember('public.tags', now()->addMinutes(self::CACHE_MINUTES),
            fn () => Tag::active()->popular()
                ->get(['id', 'name', 'slug', 'color', 'usage_count'])
                ->all()
        );

        return response()->json(['data' => $data]);
    }

    /** Everything a filter sidebar needs, in one round trip. */
    public function all(): JsonResponse
    {
        $data = Cache::remember('public.taxonomies.all', now()->addMinutes(self::CACHE_MINUTES), fn () => [
            'countries' => Country::active()->ordered()->get(['id', 'name', 'slug', 'code', 'flag_emoji']),
            'industries' => Industry::active()->ordered()->get(['id', 'name', 'slug', 'emoji', 'color']),
            'job_categories' => JobCategory::active()->ordered()->get(['id', 'name', 'slug', 'emoji', 'color']),
            'tags' => Tag::active()->popular()->limit(20)->get(['id', 'name', 'slug', 'color']),
        ]);

        return response()->json(['data' => $data]);
    }
}
