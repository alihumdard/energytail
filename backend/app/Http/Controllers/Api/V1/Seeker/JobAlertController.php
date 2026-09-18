<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Models\JobAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * A candidate's saved searches.
 *
 * An alert is a stored set of job filters plus a delivery frequency. Scoped
 * to the caller on every path — an alert belongs to exactly one user.
 */
class JobAlertController extends Controller
{
    /** More than this and the digest becomes the spam it was meant to replace. */
    private const MAX_ALERTS = 10;

    public function index(Request $request): JsonResponse
    {
        $alerts = JobAlert::query()
            ->where('user_id', $request->user()?->getKey())
            ->with([
                'category:id,name,slug',
                'industry:id,name,slug',
                'country:id,name,code',
                'city:id,name',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $alerts->map(fn (JobAlert $alert) => $this->transform($alert))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()?->getKey();

        if (JobAlert::query()->where('user_id', $userId)->count() >= self::MAX_ALERTS) {
            throw ValidationException::withMessages([
                'name' => ['You can keep up to '.self::MAX_ALERTS.' alerts. Delete one to add another.'],
            ]);
        }

        $validated = $this->validated($request);

        $alert = JobAlert::query()->create($validated + [
            'user_id' => $userId,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Alert created.',
            'data' => $this->transform($alert->fresh(['category', 'industry', 'country', 'city'])),
        ], 201);
    }

    public function update(Request $request, JobAlert $alert): JsonResponse
    {
        $this->ensureOwned($request, $alert);

        $alert->update($this->validated($request));

        return response()->json([
            'message' => 'Alert updated.',
            'data' => $this->transform($alert->fresh(['category', 'industry', 'country', 'city'])),
        ]);
    }

    /** Pauses or resumes an alert without deleting the search behind it. */
    public function toggle(Request $request, JobAlert $alert): JsonResponse
    {
        $this->ensureOwned($request, $alert);

        $active = ! $alert->is_active;
        $alert->update(['is_active' => $active]);

        return response()->json([
            'message' => $active ? 'Alert resumed.' : 'Alert paused.',
            'data' => $this->transform($alert->fresh(['category', 'industry', 'country', 'city'])),
        ]);
    }

    public function destroy(Request $request, JobAlert $alert): JsonResponse
    {
        $this->ensureOwned($request, $alert);

        $alert->delete();

        return response()->json(['message' => 'Alert deleted.']);
    }

    /**
     * Refuses an alert belonging to someone else.
     *
     * 404 rather than 403: confirming that an alert exists would leak that
     * another user has one with that id.
     */
    private function ensureOwned(Request $request, JobAlert $alert): void
    {
        abort_if($alert->user_id !== $request->user()?->getKey(), 404);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $required = $request->isMethod('POST') ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'keywords' => ['sometimes', 'nullable', 'string', 'max:200'],
            'job_category_id' => ['sometimes', 'nullable', 'integer', 'exists:job_categories,id'],
            'industry_id' => ['sometimes', 'nullable', 'integer', 'exists:industries,id'],
            'country_id' => ['sometimes', 'nullable', 'integer', 'exists:countries,id'],
            'city_id' => ['sometimes', 'nullable', 'integer', 'exists:cities,id'],
            'employment_type' => ['sometimes', 'nullable', Rule::in([
                'full_time', 'part_time', 'contract', 'temporary', 'internship',
            ])],
            'is_remote' => ['sometimes', 'boolean'],
            'salary_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'frequency' => [$required, Rule::in(['daily', 'weekly', 'monthly'])],
        ], [
            'name.required' => 'Give the alert a name so you can recognise it later.',
        ]);
    }

    /** @return array<string, mixed> */
    private function transform(JobAlert $alert): array
    {
        return [
            'id' => $alert->id,
            'name' => $alert->name,
            'keywords' => $alert->keywords,
            'employment_type' => $alert->employment_type,
            'is_remote' => $alert->is_remote,
            'salary_min' => $alert->salary_min,
            'frequency' => $alert->frequency,
            'is_active' => $alert->is_active,
            'last_sent_at' => $alert->last_sent_at?->toIso8601String(),
            'created_at' => $alert->created_at?->toIso8601String(),
            'job_category_id' => $alert->job_category_id,
            'industry_id' => $alert->industry_id,
            'country_id' => $alert->country_id,
            'city_id' => $alert->city_id,
            'category' => $alert->relationLoaded('category') && $alert->category
                ? ['name' => $alert->category->name]
                : null,
            'industry' => $alert->relationLoaded('industry') && $alert->industry
                ? ['name' => $alert->industry->name]
                : null,
            'country' => $alert->relationLoaded('country') && $alert->country
                ? ['name' => $alert->country->name, 'code' => $alert->country->code]
                : null,
            'city' => $alert->relationLoaded('city') && $alert->city
                ? ['name' => $alert->city->name]
                : null,
        ];
    }
}
