<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Industry;
use App\Models\Job;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<Industry>
 */
class IndustryController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return Industry::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'description'];
    }

    protected function blockingRelations(): array
    {
        return ['jobs', 'companies'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('industries', 'slug')->ignore($id)],
            'description' => ['nullable', 'string', 'max:500'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:160'],
            'meta_description' => ['nullable', 'string', 'max:320'],
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $record = null): array
    {
        // Slug is generated once and then left alone. Changing it later would
        // break the public landing page URL and any inbound links to it.
        if ($record === null && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        return $data;
    }

    protected function transform(Model $record): array
    {
        /** @var Industry $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'description' => $record->description,
            'emoji' => $record->emoji,
            'color' => $record->color,
            'jobs_count' => $record->jobs_count ?? null,
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
            'meta_title' => $record->meta_title,
            'meta_description' => $record->meta_description,
        ];
    }

    protected function extraStats(): array
    {
        return [
            'jobs' => Job::query()->whereNotNull('industry_id')->count(),
        ];
    }

    protected function top(): array
    {
        return Industry::query()
            ->withCount(['jobs' => fn ($q) => $q->where('status', Job::STATUS_PUBLISHED)])
            ->orderByDesc('jobs_count')
            ->limit(5)
            ->get()
            ->map(fn (Industry $industry) => [
                'label' => $industry->name,
                'value' => $industry->jobs_count,
            ])->all();
    }
}
