<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The candidate's skills.
 *
 * Unlike the other sections this is a pivot onto the shared `skills`
 * taxonomy rather than free text, so a candidate's "Well Control" is the same
 * row an employer filtered a job by. That is the whole point — free text here
 * would make skill matching impossible.
 */
class SeekerSkillController extends Controller
{
    public const PROFICIENCY = ['beginner', 'intermediate', 'advanced', 'expert'];

    /** Enough for a real career; not enough to paste the whole taxonomy in. */
    private const MAX_SKILLS = 40;

    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->list($request->user())]);
    }

    /**
     * Replaces the whole set in one call.
     *
     * The editor is a multi-select: the candidate manipulates a list and
     * saves it. Syncing the set matches that, and avoids the add/remove
     * round-trips leaving the pivot half-updated.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'skills' => ['present', 'array', 'max:'.self::MAX_SKILLS],
            'skills.*.skill_id' => ['required', 'integer', 'exists:skills,id'],
            'skills.*.proficiency' => ['nullable', Rule::in(self::PROFICIENCY)],
            'skills.*.years_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
        ]);

        $payload = [];

        foreach ($validated['skills'] as $position => $entry) {
            // Keyed by skill_id, so the same skill sent twice collapses to one
            // row rather than failing on the pivot's unique constraint.
            $payload[(int) $entry['skill_id']] = [
                'proficiency' => $entry['proficiency'] ?? null,
                'years_experience' => $entry['years_experience'] ?? null,
                'sort_order' => $position,
            ];
        }

        $user = $request->user();
        $user?->skills()->sync($payload);

        return response()->json([
            'message' => 'Skills updated.',
            'data' => $this->list($user),
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    private function list(?User $user): array
    {
        if ($user === null) {
            return [];
        }

        return $user->skills()
            ->orderBy('seeker_skill.sort_order')
            ->get()
            ->map(function (Skill $skill): array {
                /*
                 * The pivot columns carry the candidate's own rating of the
                 * skill. Eloquent attaches `pivot` at runtime rather than
                 * declaring it on the model, so it is read as a relation
                 * value instead of a property.
                 */
                $pivot = $skill->getRelationValue('pivot');

                return [
                    'skill_id' => $skill->id,
                    'name' => $skill->name,
                    'slug' => $skill->slug,
                    'proficiency' => $pivot?->getAttribute('proficiency'),
                    'years_experience' => $pivot?->getAttribute('years_experience'),
                ];
            })
            ->all();
    }
}
