<?php

namespace App\Http\Controllers\Api\V1\Admin\Taxonomy;

use App\Models\Article;
use App\Models\ArticleCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends BaseTaxonomyController<ArticleCategory>
 */
class ArticleCategoryController extends BaseTaxonomyController
{
    protected function model(): string
    {
        return ArticleCategory::class;
    }

    protected function searchable(): array
    {
        return ['name', 'slug', 'description'];
    }

    protected function blockingRelations(): array
    {
        return ['articles', 'children'];
    }

    protected function storeRules(Request $request): array
    {
        $id = $request->route('id');

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('article_categories', 'slug')->ignore($id)],
            'description' => ['nullable', 'string', 'max:500'],
            'parent_id' => ['nullable', 'integer', 'exists:article_categories,id'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:160'],
            'meta_description' => ['nullable', 'string', 'max:320'],
        ];
    }

    protected function updateRules(Request $request, Model $record): array
    {
        $rules = $this->storeRules($request);
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
        /** @var ArticleCategory $record */
        return [
            'id' => $record->id,
            'name' => $record->name,
            'slug' => $record->slug,
            'description' => $record->description,
            'parent_id' => $record->parent_id,
            'color' => $record->color,
            'articles_count' => $record->articles_count ?? null,
            'is_active' => $record->is_active,
            'sort_order' => $record->sort_order,
            'meta_title' => $record->meta_title,
            'meta_description' => $record->meta_description,
        ];
    }

    protected function extraStats(): array
    {
        return [
            'articles' => Article::query()->whereNotNull('article_category_id')->count(),
        ];
    }

    protected function top(): array
    {
        return ArticleCategory::query()
            ->withCount(['articles' => fn ($q) => $q->where('status', Article::STATUS_PUBLISHED)])
            ->orderByDesc('articles_count')
            ->limit(5)
            ->get()
            ->map(fn (ArticleCategory $category) => [
                'label' => $category->name,
                'value' => $category->articles_count,
            ])->all();
    }
}
