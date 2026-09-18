<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobAlert;
use App\Models\JobApplyClick;
use App\Models\SavedJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A candidate's overview.
 *
 * Built on what the platform can actually observe.
 *
 * The original design showed Applied / Shortlisted / Rejected counts, but no
 * applications table exists and none can: candidates apply on the employer's
 * own site through apply_url or apply_email, and Energy Tail sees only the
 * click that sent them there. A "Shortlisted" figure would have to be
 * invented, so this reports saved jobs, alerts, and the applications the
 * candidate started — the last being a click-through, described as such.
 */
class SeekerDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $userId = $request->user()?->getKey();

        $savedTotal = SavedJob::query()->where('user_id', $userId)->count();

        // How many saved listings are still live. A candidate returning after
        // a fortnight needs to know which of their shortlist has closed.
        $savedOpen = SavedJob::query()
            ->where('user_id', $userId)
            ->whereHas('job', fn ($q) => $q->where('status', Job::STATUS_PUBLISHED))
            ->count();

        $clicks = JobApplyClick::query()->where('user_id', $userId);

        return response()->json([
            'data' => [
                'stats' => [
                    'saved_jobs' => $savedTotal,
                    'saved_open' => $savedOpen,
                    'saved_closed' => $savedTotal - $savedOpen,
                    'alerts' => JobAlert::query()->where('user_id', $userId)->count(),
                    'active_alerts' => JobAlert::query()
                        ->where('user_id', $userId)
                        ->where('is_active', true)
                        ->count(),
                    /*
                     * Applications the candidate started, not applications
                     * received: the platform records the click through to the
                     * employer and cannot know what happened afterwards.
                     */
                    'applications_started' => (clone $clicks)->count(),
                    // clicked_at, not created_at: this table records when the
                    // click happened and has no timestamps of its own.
                    'applications_this_month' => (clone $clicks)
                        ->where('clicked_at', '>=', now()->startOfMonth())
                        ->count(),
                ],
                'profile' => $this->profile($request),
            ],
        ]);
    }

    /**
     * How complete the candidate's profile is.
     *
     * Weighted evenly across the fields an employer would look for. Reported
     * as the missing pieces too, so the number comes with something to act on
     * rather than a bare percentage.
     *
     * @return array<string, mixed>
     */
    private function profile(Request $request): array
    {
        $user = $request->user();

        $checks = [
            'Name' => filled($user->first_name) && filled($user->last_name),
            'Email confirmed' => $user->hasVerifiedEmail(),
            'Phone' => filled($user->phone),
            // avatar_path is the column; avatar_url is computed by the
            // resource and does not exist on the model.
            'Photo' => filled($user->avatar_path),
        ];

        $done = count(array_filter($checks));

        return [
            'completion' => (int) round($done / max(1, count($checks)) * 100),
            'missing' => array_keys(array_filter($checks, fn (bool $ok) => ! $ok)),
        ];
    }
}
