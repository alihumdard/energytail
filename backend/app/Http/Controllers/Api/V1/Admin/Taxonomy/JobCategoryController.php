<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Job;
use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<JobCategory>
 */
class JobCategoryController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return JobCategory::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'description'];
    }

    protected function blockingRelations(): array
    {
        return ['jobs', 'children'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('job_categories', 'slug')->ignore($id)],
            'description' => ['nullable', 'string', 'max:500'],
            'parent_id' => ['nullable', 'integer', 'exists:job_categories,id'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:160'],
            'meta_description' => ['nullable', 'string', 'max:320'],
        ];
    }

    protected function updateRules(Request $request, Model $record): array
    {
        $rules = $this->storeRules($request);

        // A category cannot be its own parent, which would create a cycle the
        // tree renderer would loop on forever.
        $rules['parent_id'][] = Rule::notIn([$record->id]);

        return $rules;
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
        /** @var JobCategory $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'description' => $record->description,
            'parent_id' => $record->parent_id,
            'emoji' => $record->emoji,
            'color' => $record->color,
            'jobs_count' => $record->jobs_count ?? null,
            'is_active' => $record->is_active,
            'is_featured' => $record->is_featured,
            'sort_order' => $record->sort_order,
            'meta_title' => $record->meta_title,
            'meta_description' => $record->meta_description,
        ];
    }

    protected function extraStats(): array
    {
        return [
            'jobs' => Job::query()->whereNotNull('job_category_id')->count(),
            'featured' => JobCategory::query()->where('is_featured', true)->count(),
        ];
    }

    protected function top(): array
    {
        return JobCategory::query()
            ->withCount(['jobs' => fn ($q) => $q->where('status', Job::STATUS_PUBLISHED)])
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get()
            ->map(fn (JobCategory $category) => [
                'label' => $category->name,
                'value' => $category->jobs_count,
            ])->all();
    }
}
