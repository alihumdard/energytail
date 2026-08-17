<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Audit trail with the filters the design's screen exposes: user, role,
     * action, module, status, IP and date range.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAudit('view');

        $query = Activity::query()->with('causer');

        if ($module = $request->string('module')->toString()) {
            $query->where('module', $module);
        }

        if ($action = $request->string('action')->toString()) {
            $query->where('action', $action);
        }

        if ($role = $request->string('role')->toString()) {
            $query->where('actor_role', $role);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($ip = $request->string('ip')->toString()) {
            $query->where('ip_address', $ip);
        }

        if ($userId = $request->integer('user_id')) {
            $query->where('causer_id', $userId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($inner) use ($search) {
                $inner->where('description', 'ilike', "%{$search}%")
                    ->orWhere('actor_name', 'ilike', "%{$search}%");
            });
        }

        if ($from = $request->date('from')) {
            $query->where('created_at', '>=', $from->startOfDay());
        }

        if ($to = $request->date('to')) {
            $query->where('created_at', '<=', $to->endOfDay());
        }

        // Newest first: an audit screen is read from the most recent event.
        $logs = $query->latest()
            ->paginate(min(100, max(1, $request->integer('per_page', 20))));

        return response()->json([
            'data' => collect($logs->items())->map(fn (Activity $log) => $this->transform($log)),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /** Distinct values for the filter dropdowns. */
    public function filters(): JsonResponse
    {
        $this->authorizeAudit('view');

        return response()->json([
            'data' => [
                'modules' => Activity::query()->whereNotNull('module')
                    ->distinct()->orderBy('module')->pluck('module'),
                'actions' => Activity::query()->whereNotNull('action')
                    ->distinct()->orderBy('action')->pluck('action'),
                'roles' => Activity::query()->whereNotNull('actor_role')
                    ->distinct()->orderBy('actor_role')->pluck('actor_role'),
                'statuses' => Activity::query()->distinct()->orderBy('status')->pluck('status'),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        $this->authorizeAudit('view');

        return response()->json([
            'data' => [
                'total' => Activity::count(),
                'today' => Activity::whereDate('created_at', today())->count(),
                'failed' => Activity::where('status', 'failed')->count(),
                'by_module' => Activity::query()
                    ->selectRaw('module, count(*) as total')
                    ->whereNotNull('module')
                    ->groupBy('module')->orderByDesc('total')->limit(10)->get(),
                // Failed sign-ins over the last week: the figure worth
                // watching for a brute-force attempt.
                'failed_logins_week' => Activity::where('action', 'login_failed')
                    ->where('created_at', '>=', now()->subWeek())->count(),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->authorizeAudit('export');

        $query = Activity::query()->with('causer')->latest();

        if ($from = $request->date('from')) {
            $query->where('created_at', '>=', $from->startOfDay());
        }

        if ($to = $request->date('to')) {
            $query->where('created_at', '<=', $to->endOfDay());
        }

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'Date', 'Time', 'User', 'Role', 'Action',
                'Module', 'Description', 'IP', 'Status',
            ]);

            // Chunked so exporting a large log does not exhaust memory.
            $query->chunk(500, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->created_at?->toDateString(),
                        $log->created_at?->toTimeString(),
                        $log->actor_name,
                        $log->actor_role,
                        $log->action,
                        $log->module,
                        $log->description,
                        $log->ip_address,
                        $log->status,
                    ]);
                }
            });

            fclose($handle);
        }, 'audit-log.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(Activity $log): array
    {
        return [
            'id' => $log->id,
            'date' => $log->created_at?->toDateString(),
            'time' => $log->created_at?->format('h:i:s A'),
            'timestamp' => $log->created_at?->toIso8601String(),
            'user' => $log->actor_name,
            'user_id' => $log->causer_id,
            'role' => $log->actor_role,
            'action' => $log->action,
            'module' => $log->module,
            'description' => $log->description,
            'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
            'subject_id' => $log->subject_id,
            'ip' => $log->ip_address,
            'status' => $log->status,
            'properties' => $log->properties,
        ];
    }

    private function authorizeAudit(string $action): void
    {
        if (! request()->user()?->can("audit_logs.{$action}")) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }
}
