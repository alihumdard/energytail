<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\City;
use App\Models\Country;
use App\Models\Job;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @extends BaseTaxonomyController<City>
 */
class CityController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return City::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'region'];
    }

    protected function with(): array
    {
        // Every row shows its country name and flag, so eager loading here
        // avoids a query per row.
        return ['country'];
    }

    protected function blockingRelations(): array
    {
        return ['jobs', 'companies'];
    }

    protected function storeRules(Request $request): array
    {
        return [
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'name' => ['required', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $record = null): array
    {
        if ($record === null) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }

    protected function transform(Model $record): array
    {
        /** @var City $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'region' => $record->region,

            /*
             * The foreign key as well as the expanded relation.
             *
             * Writes take country_id, so a read that returned only the nested
             * country left an edit form with nothing to pre-select — the
             * required field came back empty and saving was refused. A
             * resource should return the key it accepts.
             */
            'country_id' => $record->country_id,

            'country' => $record->relationLoaded('country') && $record->country
                ? [
                    'id' => $record->country->id,
                    'name' => $record->country->name,
                    'code' => $record->country->code,
                    'flag_emoji' => $record->country->flag_emoji,
                ]
                : null,
            'latitude' => $record->latitude,
            'longitude' => $record->longitude,
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
        ];
    }

    protected function extraStats(): array
    {
        return [
            'jobs' => Job::query()->whereNotNull('city_id')->count(),
        ];
    }

    /** Cities grouped by country. */
    protected function donut(): array
    {
        $palette = ['#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#cbd5e1'];

        // Query builder rather than Eloquent: these are aggregate rows, not
        // City models.
        $rows = DB::table('cities')
            ->selectRaw('country_id, count(*) as total')
            ->whereNull('deleted_at')
            ->groupBy('country_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $names = Country::whereIn('id', $rows->pluck('country_id'))->pluck('name', 'id');
        $sum = max(1, City::count());

        $slices = $rows->values()->map(fn (object $row, int $i) => [
            'label' => $names[$row->country_id] ?? 'Unknown',
            'value' => (int) $row->total,
            'pct' => round((int) $row->total / $sum * 100, 1),
            'color' => $palette[$i % count($palette)],
        ])->all();

        // Everything outside the top five is folded into one slice, so the
        // percentages still add up to 100.
        $counted = array_sum(array_column($slices, 'value'));

        if ($counted < $sum) {
            $slices[] = [
                'label' => 'Others',
                'value' => $sum - $counted,
                'pct' => round(($sum - $counted) / $sum * 100, 1),
                'color' => '#cbd5e1',
            ];
        }

        return $slices;
    }

    protected function top(): array
    {
        return City::query()
            ->with('country')
            ->withCount(['jobs' => fn ($q) => $q->where('status', Job::STATUS_PUBLISHED)])
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get()
            ->map(fn (City $city) => [
                'label' => $city->country
                    ? "{$city->name}, {$city->country->name}"
                    : $city->name,
                'value' => $city->jobs_count,
            ])->all();
    }
}
