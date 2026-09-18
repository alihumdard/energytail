<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
     * Counts the pivot rather than trusting tags.usage_count.
     *
     * That column is a denormalised counter that nothing maintains: it read 0
     * for every tag while the pivot held 165 assignments, so the table showed
     * every tag as unused, "In Use" said 0 next to "Assignments 165", and the
     * ranking it drives was meaningless.
     *
     * Aliased to usage_count so everything downstream — the transform, the
     * default ordering, the sortable list — keeps working unchanged, and the
     * figure can no longer drift from the truth.
     */
    private function usageSubquery(): QueryBuilder
    {
        return DB::table('taggables')
            ->selectRaw('count(*)')
            ->whereColumn('taggables.tag_id', 'tags.id');
    }

    /** @param  Builder<Model>  $query */
    protected function decorate(Builder $query): void
    {
        $query
            // Explicit columns rather than tags.*: selecting the stale
            // usage_count alongside the alias would leave two columns of the
            // same name and an ambiguous ORDER BY.
            ->select([
                'tags.id',
                'tags.name',
                'tags.slug',
                'tags.color',
                'tags.is_active',
                'tags.created_at',
                'tags.updated_at',
            ])
            ->selectSub($this->usageSubquery(), 'usage_count');
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
            // Counted from the pivot for the same reason as usageSubquery(),
            // but joined to tags so a deleted tag's leftover rows are not
            // counted — that put "in use" above the total number of tags.
            'in_use' => (int) $this->liveAssignments()->distinct()->count('taggables.tag_id'),
            'assignments' => (int) $this->liveAssignments()->count(),
        ];
    }

    /**
     * Pivot rows whose tag still exists.
     *
     * Tags are soft-deleted, so their assignments stay behind; counting those
     * reported more tags in use than there were tags.
     */
    private function liveAssignments(): QueryBuilder
    {
        return DB::table('taggables')
            ->join('tags', 'tags.id', '=', 'taggables.tag_id')
            ->whereNull('tags.deleted_at');
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

        // Live usage per tag, so the buckets describe reality rather than the
        // stale counter column.
        $usage = $this->usageByTag();

        return collect($buckets)->map(function (array $bucket) use ($total, $usage) {
            $count = $usage->filter(
                fn (int $used) => $used >= $bucket['min']
                    && ($bucket['max'] === null || $used <= $bucket['max'])
            )->count();

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
        return $this->baseQuery()
            ->orderByDesc('usage_count')
            ->orderBy('name')
            ->limit(5)
            ->get()
            ->values()
            // Model rather than Tag: baseQuery is declared as Builder<Model>,
            // so what comes back is a collection of Model.
            ->map(fn (Model $tag, int $i) => [
                'label' => $tag->getAttribute('name'),
                'value' => (int) $tag->getAttribute('usage_count'),
                'rank' => $i + 1,
            ])->all();
    }

    /**
     * Usage per tag, keyed by id, including tags with none.
     *
     * @return Collection<int, int>
     */
    private function usageByTag(): Collection
    {
        $counts = $this->liveAssignments()
            ->select('taggables.tag_id', DB::raw('count(*) as total'))
            ->groupBy('taggables.tag_id')
            ->pluck('total', 'tag_id');

        // Tags with nothing attached are absent from the pivot, but they still
        // belong in the "0 - 9" bucket rather than vanishing from the chart.
        return Tag::query()
            ->pluck('id')
            ->mapWithKeys(fn (int $id) => [$id => (int) ($counts[$id] ?? 0)]);
    }
}
