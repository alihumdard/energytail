<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Models\SeekerExperience;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** A candidate's work history. */
class ExperienceController extends BaseSectionController
{
    protected function model(): string
    {
        return SeekerExperience::class;
    }

    /** @return array<string, mixed> */
    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        return [
            'job_title' => ['required', 'string', 'max:160'],
            'company_name' => ['required', 'string', 'max:160'],
            'location' => ['nullable', 'string', 'max:160'],
            'employment_type' => ['nullable', 'string', 'max:40'],
            'started_on' => ['nullable', 'date'],
            // A role cannot have ended before it began.
            'ended_on' => ['nullable', 'date', 'after_or_equal:started_on'],
            'is_current' => ['boolean'],
            'description' => ['nullable', 'string', 'max:5000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Current roles first, then most recent. A CV reads newest-first, so the
     * candidate's manual sort_order is not what this section wants.
     *
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
     * "I still work here" and an end date contradict each other. The checkbox
     * is what the candidate actually clicked, so it wins and the stale date
     * is cleared rather than silently kept.
     *
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
        /** @var SeekerExperience $row */
        return [
            'id' => $row->id,
            'job_title' => $row->job_title,
            'company_name' => $row->company_name,
            'location' => $row->location,
            'employment_type' => $row->employment_type,
            'started_on' => $row->started_on?->toDateString(),
            'ended_on' => $row->ended_on?->toDateString(),
            'is_current' => $row->is_current,
            'description' => $row->description,
            'sort_order' => $row->sort_order,
        ];
    }
}
