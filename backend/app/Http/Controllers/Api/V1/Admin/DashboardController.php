<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Article;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * The administrator's overview.
 *
 * Everything here is counted from the database at request time. The figures
 * an administrator acts on cannot come from a cached column that has drifted
 * — companies.jobs_count was already wrong by half when this was written.
 */
class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        // Guarded by the same permission as the audit log: seeing the whole
        // platform's numbers is a moderator's view, not every staff role's.
        $this->authorize('viewAny', User::class);

        return response()->json([
            'data' => [
                'totals' => $this->totals(),
                'moderation' => $this->moderation(),
                'jobsByCategory' => $this->jobsByCategory(),
                'topCountries' => $this->topCountries(),
                'usersByRole' => $this->usersByRole(),
                'recentActivity' => $this->recentActivity(),
            ],
        ]);
    }

    /** @return array<string, int> */
    private function totals(): array
    {
        return [
            'users' => User::query()->count(),
            'companies' => Company::query()->count(),
            'jobs' => Job::query()->count(),
            'published_jobs' => Job::query()->where('status', Job::STATUS_PUBLISHED)->count(),
            'articles' => Article::query()->count(),
            'published_articles' => Article::query()->where('status', Article::STATUS_PUBLISHED)->count(),
            /*
             * Views and apply clicks, not applications.
             *
             * There is no applications table by design: candidates apply on
             * the employer's own site through apply_url/apply_email, and the
             * platform records only the click that sent them there.
             */
            'job_views' => (int) Job::query()->sum('views_count'),
            'apply_clicks' => (int) Job::query()->sum('apply_clicks_count'),
            'article_views' => (int) Article::query()->sum('views_count'),
        ];
    }

    /**
     * What is waiting for a moderator, and where to go to deal with it.
     *
     * @return array<string, int>
     */
    private function moderation(): array
    {
        return [
            'jobs_pending' => Job::query()->where('status', Job::STATUS_PENDING_REVIEW)->count(),
            'articles_pending' => Article::query()->where('status', Article::STATUS_PENDING_REVIEW)->count(),
            'companies_pending' => Company::query()->where('status', Company::STATUS_PENDING)->count(),
            'suspended_users' => User::query()->where('status', 'suspended')->count(),
            'unverified_companies' => Company::query()->where('is_verified', false)->count(),
        ];
    }

    /**
     * Published jobs per category, largest first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function jobsByCategory(): array
    {
        $rows = DB::table('jobs')
            ->join('job_categories', 'jobs.job_category_id', '=', 'job_categories.id')
            ->where('jobs.status', Job::STATUS_PUBLISHED)
            ->whereNull('jobs.deleted_at')
            ->selectRaw('job_categories.name, count(*) as total')
            ->groupBy('job_categories.name')
            ->orderByDesc('total')
            ->orderBy('job_categories.name')
            ->limit(5)
            ->get();

        $palette = ['#2563eb', '#7c3aed', '#059669', '#f59e0b', '#e11d48'];
        $sum = max(1, (int) $rows->sum('total'));

        return $rows->values()->map(fn ($row, $index) => [
            'label' => $row->name,
            'value' => (int) $row->total,
            'pct' => round((int) $row->total / $sum * 100, 1),
            'color' => $palette[$index % count($palette)],
        ])->all();
    }

    /**
     * Where the published jobs are.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topCountries(): array
    {
        $rows = DB::table('jobs')
            ->join('countries', 'jobs.country_id', '=', 'countries.id')
            ->where('jobs.status', Job::STATUS_PUBLISHED)
            ->whereNull('jobs.deleted_at')
            ->selectRaw('countries.name, countries.code, countries.flag_emoji, count(*) as total')
            ->groupBy('countries.name', 'countries.code', 'countries.flag_emoji')
            ->orderByDesc('total')
            ->orderBy('countries.name')
            ->limit(5)
            ->get();

        // The bars are drawn against the largest, so an empty board would
        // otherwise divide by zero.
        $max = max(1, (int) $rows->max('total'));

        return $rows->map(fn ($row) => [
            'label' => $row->name,
            'code' => $row->code,
            'flag' => $row->flag_emoji,
            'value' => (int) $row->total,
            'max' => $max,
        ])->all();
    }

    /**
     * How the user base splits by role.
     *
     * @return array<int, array<string, mixed>>
     */
    private function usersByRole(): array
    {
        $rows = DB::table('model_has_roles')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->join('users', function ($join) {
                $join->on('model_has_roles.model_id', '=', 'users.id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->whereNull('users.deleted_at')
            ->selectRaw('roles.name, count(*) as total')
            ->groupBy('roles.name')
            ->orderByDesc('total')
            ->get();

        return $rows->map(fn ($row) => [
            'role' => $row->name,
            'label' => ucfirst(str_replace('_', ' ', $row->name)),
            'value' => (int) $row->total,
        ])->all();
    }

    /**
     * The last few things that happened, from the audit log.
     *
     * @return array<int, array<string, mixed>>
     */
    private function recentActivity(): array
    {
        return Activity::query()
            ->with('causer')
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'module' => $activity->module,
                'action' => $activity->action,
                'description' => $activity->description,
                'user' => $activity->actor_name,
                'created_at' => $activity->created_at?->toIso8601String(),
            ])
            ->all();
    }
}
