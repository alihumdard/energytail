<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Country;
use App\Models\Job;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<Country>
 */
class CountryController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return Country::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'code', 'region'];
    }

    protected function blockingRelations(): array
    {
        return ['cities', 'jobs', 'companies'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'size:2', Rule::unique('countries', 'code')->ignore($id)],
            'code_alpha3' => ['nullable', 'string', 'size:3', Rule::unique('countries', 'code_alpha3')->ignore($id)],
            'phone_code' => ['nullable', 'string', 'max:8'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'region' => ['nullable', 'string', 'max:80'],
            'flag_emoji' => ['nullable', 'string', 'max:16'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $record = null): array
    {
        $data['code'] = Str::upper($data['code']);

        if (isset($data['code_alpha3'])) {
            $data['code_alpha3'] = Str::upper($data['code_alpha3']);
        }

        // Slug follows the name unless the record already has one, so editing
        // a country's spelling does not break its public URL.
        if ($record === null) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }

    protected function transform(Model $record): array
    {
        /** @var Country $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'code' => $record->code,
            'code_alpha3' => $record->code_alpha3,
            'phone_code' => $record->phone_code,
            'currency_code' => $record->currency_code,
            'region' => $record->region,
            'flag_emoji' => $record->flag_emoji,
            'cities_count' => $record->cities_count ?? null,
            'jobs_count' => $record->jobs_count ?? null,
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
        ];
    }

    protected function with(): array
    {
        return [];
    }

    protected function extraStats(): array
    {
        return [
            'jobs' => Job::query()->whereNotNull('country_id')->count(),
        ];
    }

    /** Countries grouped by region, which is what the donut shows. */
    protected function donut(): array
    {
        $palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#cbd5e1'];

        // Query builder rather than Eloquent: this returns aggregate rows, not
        // Country models, so hydrating them would be misleading.
        $rows = DB::table('countries')
            ->selectRaw('region, count(*) as total')
            ->whereNull('deleted_at')
            ->groupBy('region')
            ->orderByDesc('total')
            ->get();

        $sum = max(1, (int) $rows->sum('total'));

        return $rows->values()->map(fn (object $row, int $i) => [
            'label' => $row->region ?: 'Unassigned',
            'value' => (int) $row->total,
            'pct' => round((int) $row->total / $sum * 100, 1),
            'color' => $palette[$i % count($palette)],
        ])->all();
    }

    /** Countries with the most published jobs. */
    protected function top(): array
    {
        return Country::query()
            ->withCount(['jobs' => fn ($q) => $q->where('status', Job::STATUS_PUBLISHED)])
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get()
            ->map(fn (Country $country) => [
                'label' => $country->name,
                'value' => $country->jobs_count,
            ])->all();
    }
}
