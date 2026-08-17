<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<Tag>
 */
class TagController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return Tag::class;
    }

    /**
     * Tags have no sort_order column — the table ranks by how heavily each
     * tag is used, which is what the admin screen displays.
     */
    protected function defaultOrder(): array
    {
        return [['usage_count', 'desc'], ['name', 'asc']];
    }

    protected function sortable(): array
    {
        return ['name', 'slug', 'usage_count', 'created_at', 'is_active'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:100', Rule::unique('tags', 'slug')->ignore($id)],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
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
        /** @var Tag $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'color' => $record->color,
            'usage_count' => $record->usage_count,
            'is_active' => $record->is_active,
            'created_at' => $record->created_at?->toIso8601String(),
        ];
    }

    /**
     * Tags have no sort_order column — they are ranked by how heavily they are
     * used, so the ordering is data-driven rather than admin-defined.
     */
    public function reorder(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Tags are ordered by usage and cannot be reordered manually.',
            'code' => 'not_supported',
        ], 422);
    }

    protected function extraStats(): array
    {
        return [
            // Tags attached to at least one job or article.
            'in_use' => Tag::query()->where('usage_count', '>', 0)->count(),
            'assignments' => (int) DB::table('taggables')->count(),
        ];
    }

    /** Tags bucketed by usage, which is what the donut shows. */
    protected function donut(): array
    {
        $buckets = [
            ['label' => '1000+', 'min' => 1000, 'max' => null, 'color' => '#3b82f6'],
            ['label' => '500 - 999', 'min' => 500, 'max' => 999, 'color' => '#10b981'],
            ['label' => '100 - 499', 'min' => 100, 'max' => 499, 'color' => '#f59e0b'],
            ['label' => '10 - 99', 'min' => 10, 'max' => 99, 'color' => '#f97316'],
            ['label' => '0 - 9', 'min' => 0, 'max' => 9, 'color' => '#a855f7'],
        ];

        $total = max(1, Tag::count());

        return collect($buckets)->map(function (array $bucket) use ($total) {
            $query = Tag::query()->where('usage_count', '>=', $bucket['min']);

            if ($bucket['max'] !== null) {
                $query->where('usage_count', '<=', $bucket['max']);
            }

            $count = $query->count();

            return [
                'label' => $bucket['label'],
                'value' => $count,
                'pct' => round($count / $total * 100, 1),
                'color' => $bucket['color'],
            ];
        })->all();
    }

    protected function top(): array
    {
        return Tag::query()
            ->orderByDesc('usage_count')
            ->limit(5)
            ->get()
            ->values()
            ->map(fn (Tag $tag, int $i) => [
                'label' => $tag->name,
                'value' => $tag->usage_count,
                'rank' => $i + 1,
            ])->all();
    }
}
