<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Models\PortfolioItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Projects and work samples. */
class PortfolioController extends BaseSectionController
{
    protected function model(): string
    {
        return PortfolioItem::class;
    }

    /** @return array<string, mixed> */
    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'url' => ['nullable', 'url', 'max:255'],
            'completed_on' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @param  Builder<Model>  $query
     * @return Builder<Model>
     */
    protected function applyOrder(Builder $query): Builder
    {
        return $query->orderByRaw('completed_on desc nulls last')->orderByDesc('id');
    }

    /** @return array<string, mixed> */
    protected function transform(Model $row): array
    {
        /** @var PortfolioItem $row */
        return [
            'id' => $row->id,
            'title' => $row->title,
            'description' => $row->description,
            'url' => $row->url,
            'image_path' => $row->image_path,
            'completed_on' => $row->completed_on?->toDateString(),
            'sort_order' => $row->sort_order,
        ];
    }
}
