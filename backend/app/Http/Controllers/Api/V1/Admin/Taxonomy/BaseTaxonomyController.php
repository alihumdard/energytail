<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Shared behaviour for the six admin-managed taxonomies: industries, job
 * categories, countries, cities, skills and tags.
 *
 * All six screens are the same design — a searchable table with an active
 * toggle, drag ordering, a stats strip, a donut and a top-five panel — so the
 * behaviour lives here once and each subclass supplies only what differs.
 *
 * @template TModel of Model
 */
abstract class BaseTaxonomyController extends Controller
{
    /** @return class-string<TModel> */
    abstract protected function model(): string;

    /** Permission module this resource belongs to, e.g. 'taxonomy'. */
    protected function module(): string
    {
        return 'taxonomy';
    }

    /**
     * Columns a search term is matched against.
     *
     * @return array<int, string>
     */
    protected function searchable(): array
    {
        return ['name', 'slug'];
    }

    /** Relations eager loaded on the index, to avoid N+1 queries. */
    protected function with(): array
    {
        return [];
    }

    /**
     * Relations that block deletion when non-empty. Deactivating is always
     * allowed; deleting a category that still has jobs attached is not.
     *
     * @return array<int, string>
     */
    protected function blockingRelations(): array
    {
        return [];
    }

    /**
     * Relations counted on every read, exposed to transform() as
     * "<relation>_count".
     *
     * Defaults to the blocking relations because those are exactly what the
     * screens show — "4 cities" is both the usage figure in the table and the
     * reason a delete is refused, so counting them keeps the two consistent.
     *
     * @return array<int, string>
     */
    protected function countableRelations(): array
    {
        return $this->blockingRelations();
    }

    /**
     * Base query with counts applied, shared by every read path so a record
     * carries the same shape whether it came from the list or from a write.
     *
     * Typed as Builder<Model> rather than Builder<TModel>: the static
     * model()::query() call cannot carry the template through, and every
     * consumer here passes the result to transform(), which accepts Model.
     *
     * @return Builder<Model>
     */
    protected function baseQuery(): Builder
    {
        $query = $this->model()::query()
            ->with($this->with())
            ->withCount($this->countableRelations());

        $this->decorate($query);

        return $query;
    }

    /**
     * Hook for a subclass to add selects or joins the shared query cannot
     * know about — tags replace a stale counter column with a live count
     * this way.
     *
     * Modifies the query in place rather than returning it: Builder's model
     * template is invariant, so a subclass returning Builder<Tag> could never
     * satisfy a parent declaring Builder<Model>.
     *
     * @param  Builder<Model>  $query
     */
    protected function decorate(Builder $query): void
    {
        // Nothing by default.
    }

    abstract protected function storeRules(Request $request): array;

    /** @param TModel $record */
    protected function updateRules(Request $request, Model $record): array
    {
        return $this->storeRules($request);
    }

    /**
     * Transforms one record for the API response.
     *
     * @param  TModel  $record
     * @return array<string, mixed>
     */
    abstract protected function transform(Model $record): array;

    /**
     * Per-resource stats strip. Base counts are supplied here; subclasses
     * add resource-specific figures such as "jobs using skills".
     */
    protected function extraStats(): array
    {
        return [];
    }

    /**
     * Default ordering for the listing.
     *
     * Most taxonomies carry an admin-defined sort_order, but tags do not —
     * they rank by usage instead — so each resource declares its own.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    protected function defaultOrder(): array
    {
        return [['sort_order', 'asc'], ['name', 'asc']];
    }

    /**
     * Columns a caller may sort by. Allow-listed so an arbitrary column name
     * can never reach SQL.
     *
     * @return array<int, string>
     */
    protected function sortable(): array
    {
        return ['name', 'slug', 'sort_order', 'created_at', 'is_active'];
    }

    /** Donut breakdown for the stats panel. */
    protected function donut(): array
    {
        $model = $this->model();

        $active = $model::query()->where('is_active', true)->count();
        $inactive = $model::query()->where('is_active', false)->count();
        $total = max(1, $active + $inactive);

        return [
            ['label' => 'Active', 'value' => $active,
                'pct' => round($active / $total * 100, 1), 'color' => '#10b981'],
            ['label' => 'Inactive', 'value' => $inactive,
                'pct' => round($inactive / $total * 100, 1), 'color' => '#ef4444'],
        ];
    }

    /** Top five ranking panel. */
    protected function top(): array
    {
        return [];
    }

    // ------------------------------------------------------------ endpoints

    public function index(Request $request): JsonResponse
    {
        $this->authorizeModule('view');

        $query = $this->baseQuery();

        $this->applySearch($query, $request->string('search')->toString());
        $this->applyActiveFilter($query, $request);
        $this->applySort($query, $request);

        $perPage = min(100, max(1, $request->integer('per_page', 15)));
        $records = $query->paginate($perPage);

        return response()->json([
            'data' => collect($records->items())
                ->map(fn (Model $record) => $this->transform($record))
                ->all(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $this->authorizeModule('view');

        $record = $this->baseQuery()->findOrFail($id);

        return response()->json(['data' => $this->transform($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeModule('add');

        $data = $request->validate($this->storeRules($request));
        $data = $this->prepare($data, $request);

        $record = $this->model()::query()->create($data);

        return response()->json([
            'message' => 'Created.',
            // Re-read through baseQuery so the reply carries the same counts
            // the list does; without them the new row renders blank.
            'data' => $this->transform($this->baseQuery()->findOrFail($record->getKey())),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeModule('edit');

        $record = $this->model()::query()->findOrFail($id);

        $data = $request->validate($this->updateRules($request, $record));
        $data = $this->prepare($data, $request, $record);

        $record->update($data);

        return response()->json([
            'message' => 'Updated.',
            'data' => $this->transform($this->baseQuery()->findOrFail($id)),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->authorizeModule('delete');

        $record = $this->model()::query()->findOrFail($id);

        $this->guardAgainstInUse($record);

        $record->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    /** Active toggle on each table row. */
    public function toggleActive(int $id): JsonResponse
    {
        $this->authorizeModule('edit');

        $record = $this->model()::query()->findOrFail($id);

        $isActive = ! (bool) $record->getAttribute('is_active');
        $record->update(['is_active' => $isActive]);

        return response()->json([
            'message' => $isActive ? 'Activated.' : 'Deactivated.',
            'data' => $this->transform($this->baseQuery()->findOrFail($id)),
        ]);
    }

    /** Bulk reorder after a drag, sent as one request rather than per row. */
    public function reorder(Request $request): JsonResponse
    {
        $this->authorizeModule('edit');

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*.id' => ['required', 'integer'],
            'order.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $model = $this->model();

        DB::transaction(function () use ($validated, $model) {
            foreach ($validated['order'] as $row) {
                $model::query()->whereKey($row['id'])
                    ->update(['sort_order' => $row['sort_order']]);
            }
        });

        return response()->json(['message' => 'Order updated.']);
    }

    /** Stats strip, donut and top-five panel for the screen header. */
    public function stats(): JsonResponse
    {
        $this->authorizeModule('view');

        $model = $this->model();

        return response()->json([
            'data' => [
                'stats' => array_merge([
                    'total' => $model::query()->count(),
                    'active' => $model::query()->where('is_active', true)->count(),
                    'inactive' => $model::query()->where('is_active', false)->count(),
                ], $this->extraStats()),
                'donut' => $this->donut(),
                'top' => $this->top(),
            ],
        ]);
    }

    /** CSV export, matching the Export permission in the matrix. */
    public function export(): StreamedResponse
    {
        $this->authorizeModule('export');

        $model = $this->model();
        $rows = $this->baseQuery()->get();
        $filename = str($model)->afterLast('\\')->plural()->snake()->toString();

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            $first = true;

            foreach ($rows as $record) {
                $line = $this->transform($record);

                if ($first) {
                    fputcsv($handle, array_keys($line));
                    $first = false;
                }

                // Nested values (relations, arrays) are flattened so the file
                // stays a plain CSV rather than embedding JSON in a cell.
                fputcsv($handle, array_map(
                    fn ($value) => is_scalar($value) || $value === null
                        ? $value
                        : json_encode($value),
                    $line
                ));
            }

            fclose($handle);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv']);
    }

    // -------------------------------------------------------------- helpers

    protected function authorizeModule(string $action): void
    {
        $permission = "{$this->module()}.{$action}";

        if (! request()->user()?->can($permission)) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }

    /**
     * Hook for subclasses to derive values such as slugs before saving.
     *
     * @param  array<string, mixed>  $data
     * @param  TModel|null  $record
     * @return array<string, mixed>
     */
    protected function prepare(array $data, Request $request, ?Model $record = null): array
    {
        return $data;
    }

    private function applySearch(Builder $query, string $term): void
    {
        if ($term === '') {
            return;
        }

        $columns = $this->searchable();

        $query->where(function (Builder $inner) use ($columns, $term) {
            foreach ($columns as $column) {
                $inner->orWhere($column, 'ilike', "%{$term}%");
            }
        });
    }

    private function applyActiveFilter(Builder $query, Request $request): void
    {
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
    }

    private function applySort(Builder $query, Request $request): void
    {
        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';

        if (in_array($sort, $this->sortable(), true)) {
            $query->orderBy($sort, $direction);
        } else {
            foreach ($this->defaultOrder() as [$column, $columnDirection]) {
                $query->orderBy($column, $columnDirection);
            }
        }

        /*
         * Tiebreaker, and not optional. Rows sharing a sort_order — which the
         * seeded taxonomies do — have no defined order in Postgres at all: it
         * returns them in heap order, and an UPDATE moves a row to the end of
         * the heap. Without this, editing one record reshuffles the page it
         * was on, and paging repeats some rows while skipping others.
         */
        $query->orderBy('id', 'asc');
    }

    /**
     * @throws ValidationException
     */
    /** @param TModel $record */
    private function guardAgainstInUse(Model $record): void
    {
        foreach ($this->blockingRelations() as $relation) {
            $count = $record->{$relation}()->count();

            if ($count > 0) {
                throw ValidationException::withMessages([
                    'id' => [
                        "This record is used by {$count} {$relation}. Deactivate it instead, or reassign them first.",
                    ],
                ]);
            }
        }
    }
}
