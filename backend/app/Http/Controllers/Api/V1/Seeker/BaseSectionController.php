<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Shared CRUD for the repeating sections of a candidate's profile —
 * experience, education, certificates, languages and portfolio.
 *
 * All five are the same shape: a list of rows belonging to one user, ordered
 * by the candidate, edited only by them. Writing that five times would mean
 * five chances to forget the ownership check, which is the one thing here
 * that must never be wrong: the row id travels in the URL, so without it any
 * signed-in account could edit any other candidate's history.
 */
abstract class BaseSectionController extends Controller
{
    /**
     * A cap per section. High enough that no real career hits it, low enough
     * that the endpoint cannot be used to fill the table.
     */
    protected const MAX_ROWS = 50;

    /** @return class-string<Model> */
    abstract protected function model(): string;

    /**
     * Validation rules.
     *
     * Takes the request (and, on an update, the row) so a section can express
     * a rule that depends on who is asking — a uniqueness check scoped to the
     * caller's own rows, for instance.
     *
     * @return array<string, mixed>
     */
    abstract protected function rules(Request $request, ?int $ignoreId = null): array;

    /**
     * Rules for an update — the same fields, but none of them required.
     *
     * @return array<string, mixed>
     */
    protected function updateRules(Request $request, int $ignoreId): array
    {
        $rules = [];

        foreach ($this->rules($request, $ignoreId) as $field => $constraints) {
            $relaxed = array_values(array_filter(
                is_array($constraints) ? $constraints : explode('|', (string) $constraints),
                static fn ($rule) => $rule !== 'required',
            ));

            array_unshift($relaxed, 'sometimes');
            $rules[$field] = $relaxed;
        }

        return $rules;
    }

    /**
     * How the rows are ordered when listed.
     *
     * Sections default to the candidate's own sort_order; date-bearing ones
     * override this so the most recent entry leads, which is what a CV does.
     *
     * @param  Builder<Model>  $query
     * @return Builder<Model>
     */
    protected function applyOrder(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderByDesc('id');
    }

    /** @return array<string, mixed> */
    abstract protected function transform(Model $row): array;

    public function index(Request $request): JsonResponse
    {
        $query = $this->model()::query()->where('user_id', $request->user()?->getKey());

        $rows = $this->applyOrder($query)->get();

        return response()->json([
            'data' => $rows->map(fn (Model $row) => $this->transform($row))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()?->getKey();

        if ($this->model()::query()->where('user_id', $userId)->count() >= static::MAX_ROWS) {
            return response()->json([
                'message' => 'You have reached the maximum number of entries for this section.',
            ], 422);
        }

        $validated = $request->validate($this->rules($request));
        $validated['user_id'] = $userId;

        // Appended to the end of the list unless the candidate said otherwise.
        $validated['sort_order'] ??= (int) $this->model()::query()
            ->where('user_id', $userId)
            ->max('sort_order') + 1;

        $row = $this->model()::query()->create($this->prepare($validated));

        return response()->json([
            'message' => 'Added.',
            'data' => $this->transform($row),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $row = $this->owned($request, $id);

        $row->update($this->prepare($request->validate($this->updateRules($request, $id))));

        return response()->json([
            'message' => 'Updated.',
            'data' => $this->transform($row->fresh()),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->owned($request, $id)->delete();

        return response()->json(['message' => 'Removed.']);
    }

    /**
     * Reorders the section in one call.
     *
     * Drag-and-drop produces a whole new order at once; saving it row by row
     * would leave the list briefly inconsistent if one request failed.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'max:'.static::MAX_ROWS],
            'ids.*' => ['required', 'integer'],
        ]);

        $userId = $request->user()?->getKey();

        /*
         * Scoped to the caller's own rows: an id belonging to someone else is
         * silently skipped rather than reordered, so this cannot be used to
         * probe for or touch another candidate's entries.
         */
        foreach ($validated['ids'] as $position => $id) {
            $this->model()::query()
                ->where('user_id', $userId)
                ->whereKey($id)
                ->update(['sort_order' => $position]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    /**
     * Hook for subclasses that need to massage input before saving.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function prepare(array $data): array
    {
        return $data;
    }

    /**
     * Fetches a row, refusing anything the caller does not own.
     *
     * 404 rather than 403: whether a given id exists is not information a
     * stranger is entitled to.
     */
    protected function owned(Request $request, int $id): Model
    {
        /** @var Model $row */
        $row = $this->model()::query()
            ->where('user_id', $request->user()?->getKey())
            ->whereKey($id)
            ->firstOrFail();

        return $row;
    }
}
