<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Skill;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<Skill>
 */
class SkillController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return Skill::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'category'];
    }

    protected function blockingRelations(): array
    {
        return ['jobs'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('skills', 'slug')->ignore($id)],
            'category' => ['nullable', 'string', 'max:80'],
            'icon' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'demand_level' => ['sometimes', Rule::in(['low', 'medium', 'high', 'very_high'])],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $record = null): array
    {
        if ($record === null && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }

    protected function transform(Model $record): array
    {
        /** @var Skill $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'category' => $record->category,
            'icon' => $record->icon,
            'color' => $record->color,
            'demand_level' => $record->demand_level,
            'jobs_count' => $record->jobs_count ?? null,
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
        ];
    }

    protected function extraStats(): array
    {
        return [
            // "Skills in demand" on the stats strip.
            'in_demand' => Skill::query()
                ->whereIn('demand_level', ['high', 'very_high'])
                ->count(),
            // Distinct skills actually attached to a job, not the pivot total.
            'jobs' => DB::table('job_skill')->distinct()->count('job_id'),
        ];
    }

    /** Skills grouped by their category label. */
    protected function donut(): array
    {
        $palette = ['#3b82f6', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#cbd5e1'];

        // Query builder rather than Eloquent: these are aggregate rows, not
        // Skill models.
        $rows = DB::table('skills')
            ->selectRaw('category, count(*) as total')
            ->whereNull('deleted_at')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $sum = max(1, (int) $rows->sum('total'));

        return $rows->values()->map(fn (object $row, int $i) => [
            'label' => $row->category ?: 'Uncategorised',
            'value' => (int) $row->total,
            'pct' => round((int) $row->total / $sum * 100, 1),
            'color' => $palette[$i % count($palette)],
        ])->all();
    }

    protected function top(): array
    {
        return Skill::query()
            ->withCount('jobs')
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get()
            ->map(fn (Skill $skill) => [
                'label' => $skill->name,
                'value' => $skill->jobs_count,
            ])->all();
    }
}
