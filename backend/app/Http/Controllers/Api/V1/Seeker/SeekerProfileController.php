<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Models\SeekerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The candidate's professional profile: headline, summary and what they are
 * looking for.
 *
 * Scoped to the caller throughout — no route here takes another user's id, so
 * there is nothing to authorise beyond being signed in. The one exception is
 * `visibility`, which the candidate sets for themselves and which the public
 * side will have to honour when candidate search is built.
 */
class SeekerProfileController extends Controller
{
    /** Availability options a candidate may choose. */
    private const AVAILABILITY = ['immediate', 'one_month', 'two_months', 'three_months', 'not_looking'];

    /** Who may see the profile. */
    private const VISIBILITY = ['public', 'employers', 'private'];

    private const SALARY_PERIODS = ['hour', 'day', 'month', 'year'];

    public function show(Request $request): JsonResponse
    {
        $profile = $this->profileFor($request);

        return response()->json(['data' => $this->transform($profile)]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'headline' => ['sometimes', 'nullable', 'string', 'max:160'],
            'summary' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'country_id' => ['sometimes', 'nullable', 'integer', 'exists:countries,id'],
            'city_id' => ['sometimes', 'nullable', 'integer', 'exists:cities,id'],
            'job_category_id' => ['sometimes', 'nullable', 'integer', 'exists:job_categories,id'],
            'industry_id' => ['sometimes', 'nullable', 'integer', 'exists:industries,id'],
            'experience_years' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:60'],
            'expected_salary_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'expected_salary_max' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'expected_salary_currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'salary_period' => ['sometimes', 'nullable', Rule::in(self::SALARY_PERIODS)],
            'availability' => ['sometimes', 'nullable', Rule::in(self::AVAILABILITY)],
            'open_to_remote' => ['sometimes', 'boolean'],
            'open_to_relocation' => ['sometimes', 'boolean'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'linkedin_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'visibility' => ['sometimes', Rule::in(self::VISIBILITY)],
        ]);

        /*
         * A max below the min is not a validation error the field can catch on
         * its own — both values are individually fine. Checked here so the
         * profile cannot store a range that reads backwards.
         */
        $profile = $this->profileFor($request);

        $min = $validated['expected_salary_min'] ?? $profile->expected_salary_min;
        $max = $validated['expected_salary_max'] ?? $profile->expected_salary_max;

        if ($min !== null && $max !== null && (float) $max < (float) $min) {
            return response()->json([
                'message' => 'The expected maximum salary must be at least the minimum.',
                'errors' => ['expected_salary_max' => ['Must be greater than or equal to the minimum.']],
            ], 422);
        }

        $profile->fill($validated);
        $profile->completeness = $this->completeness($profile);
        $profile->save();

        return response()->json([
            'message' => 'Profile updated.',
            'data' => $this->transform($profile->fresh()),
        ]);
    }

    /**
     * The caller's profile row, created on first read.
     *
     * Every candidate has a profile conceptually; making the row lazily means
     * the seeder and the registration flow do not both have to remember to
     * create one, and a missing row can never 404 a screen the user owns.
     */
    private function profileFor(Request $request): SeekerProfile
    {
        /** @var SeekerProfile $profile */
        $profile = SeekerProfile::query()->firstOrCreate(
            ['user_id' => $request->user()?->getKey()],
            ['visibility' => 'employers', 'completeness' => 0],
        );

        return $profile;
    }

    /**
     * A percentage for the "complete your profile" nudge.
     *
     * Weighted by what an employer actually reads: a headline and summary say
     * more than a website link. Stored rather than computed per request so a
     * dashboard can sort on it later.
     */
    private function completeness(SeekerProfile $profile): int
    {
        /** @var User|null $user */
        $user = $profile->user;

        /*
         * A list of [met, weight] pairs rather than a map keyed by the
         * condition: PHP casts a boolean array key to 0 or 1, so a map would
         * silently collapse all ten checks into two entries and score almost
         * every profile the same.
         */
        $checks = [
            [filled($profile->headline), 15],
            [filled($profile->summary), 15],
            [$profile->country_id !== null, 10],
            [$profile->job_category_id !== null, 10],
            [$profile->experience_years !== null, 10],
            [$profile->availability !== null, 5],
            [filled($profile->linkedin_url) || filled($profile->website), 5],
            [$user?->experiences()->exists() ?? false, 15],
            [$user?->educations()->exists() ?? false, 10],
            [$user?->skills()->exists() ?? false, 5],
        ];

        $score = 0;

        foreach ($checks as [$met, $weight]) {
            if ($met) {
                $score += $weight;
            }
        }

        return min(100, $score);
    }

    /** @return array<string, mixed> */
    private function transform(SeekerProfile $profile): array
    {
        return [
            'headline' => $profile->headline,
            'summary' => $profile->summary,
            'country_id' => $profile->country_id,
            'city_id' => $profile->city_id,
            'job_category_id' => $profile->job_category_id,
            'industry_id' => $profile->industry_id,
            'experience_years' => $profile->experience_years,
            'expected_salary_min' => $profile->expected_salary_min,
            'expected_salary_max' => $profile->expected_salary_max,
            'expected_salary_currency' => $profile->expected_salary_currency,
            'salary_period' => $profile->salary_period,
            'availability' => $profile->availability,
            'open_to_remote' => $profile->open_to_remote,
            'open_to_relocation' => $profile->open_to_relocation,
            'website' => $profile->website,
            'linkedin_url' => $profile->linkedin_url,
            'visibility' => $profile->visibility,
            'completeness' => $profile->completeness,
        ];
    }
}
