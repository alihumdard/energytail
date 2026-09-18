<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Models\SeekerEducation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** A candidate's qualifications. */
class EducationController extends BaseSectionController
{
    protected function model(): string
    {
        return SeekerEducation::class;
    }

    /** @return array<string, mixed> */
    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        return [
            'institution' => ['required', 'string', 'max:160'],
            'degree' => ['nullable', 'string', 'max:160'],
            'field_of_study' => ['nullable', 'string', 'max:160'],
            'grade' => ['nullable', 'string', 'max:60'],
            'started_on' => ['nullable', 'date'],
            'ended_on' => ['nullable', 'date', 'after_or_equal:started_on'],
            'is_current' => ['boolean'],
            'description' => ['nullable', 'string', 'max:5000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @param  Builder<Model>  $query
     * @return Builder<Model>
     */
    protected function applyOrder(Builder $query): Builder
    {
        return $query->orderByDesc('is_current')
            ->orderByRaw('started_on desc nulls last')
            ->orderByDesc('id');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function prepare(array $data): array
    {
        if (($data['is_current'] ?? false) === true) {
            $data['ended_on'] = null;
        }

        return $data;
    }

    /** @return array<string, mixed> */
    protected function transform(Model $row): array
    {
        /** @var SeekerEducation $row */
        return [
            'id' => $row->id,
            'institution' => $row->institution,
            'degree' => $row->degree,
            'field_of_study' => $row->field_of_study,
            'grade' => $row->grade,
            'started_on' => $row->started_on?->toDateString(),
            'ended_on' => $row->ended_on?->toDateString(),
            'is_current' => $row->is_current,
            'description' => $row->description,
            'sort_order' => $row->sort_order,
        ];
    }
}
