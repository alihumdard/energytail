<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Records an apply click and hands back where to send the candidate.
 *
 * Applications leave the platform: the plan has no applicant tracking, so an
 * employer's own careers page or inbox is the destination. What the platform
 * keeps is the click, which is the only measure of a listing's performance an
 * employer gets and the number the plan's analytics report on.
 *
 * Signed in and verified is required. Anyone may search and read — the plan
 * closes only applying and posting — and an unconfirmed address would make
 * the click figures meaningless.
 */
class JobApplyController extends Controller
{
    public function __invoke(Request $request, string $slug): JsonResponse
    {
        $job = Job::query()
            ->published()
            ->notExpired()
            ->where('slug', $slug)
            ->firstOrFail();

        $target = $job->applyTarget();

        if ($target === null) {
            return response()->json([
                'message' => 'This employer has not set a way to apply yet.',
                'code' => 'no_apply_target',
            ], 422);
        }

        $this->record($job, $request);

        return response()->json([
            'data' => [
                'method' => $job->apply_method,
                'target' => $target,
            ],
        ]);
    }

    /**
     * Writes the click, counting each candidate once per job.
     *
     * A candidate who opens the employer's page, comes back and clicks again
     * is the same interest, not two. Counting every press would let a listing
     * look twice as effective as it was.
     */
    private function record(Job $job, Request $request): void
    {
        $user = $request->user();
        $hash = sha1((string) ($user?->getKey() ?? $request->ip()));

        $alreadyClicked = $job->applyClicks()
            ->where(fn ($query) => $user
                ? $query->where('user_id', $user->getKey())
                : $query->where('visitor_hash', $hash))
            ->exists();

        if ($alreadyClicked) {
            return;
        }

        $job->applyClicks()->create([
            'user_id' => $user?->getKey(),
            'visitor_hash' => $hash,
            'ip_address' => $request->ip(),
            'referrer' => $request->headers->get('referer'),
            'apply_method' => $job->apply_method,
            'clicked_at' => now(),
        ]);

        $job->increment('apply_clicks_count');
    }
}
