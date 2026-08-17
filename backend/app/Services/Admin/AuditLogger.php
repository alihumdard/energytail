<?php

namespace App\Services\Admin;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

/**
 * Records audit events with the context the admin screen filters on.
 *
 * Spatie's activity log captures what changed; this adds who did it, from
 * where, and under which module — the columns the design's filter row needs.
 */
class AuditLogger
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public function log(
        string $module,
        string $action,
        string $description,
        ?Model $subject = null,
        ?User $actor = null,
        array $properties = [],
        string $status = 'success',
    ): Activity {
        $actor ??= auth()->user();

        /** @var Activity $activity */
        $activity = Activity::create([
            'log_name' => $module,
            'description' => $description,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'causer_type' => $actor?->getMorphClass(),
            'causer_id' => $actor?->getKey(),
            'properties' => $properties,
            'event' => $action,

            'module' => $module,
            'action' => $action,

            // The actor's name and role are captured as they were at the time.
            // Reading them from the user record at display time would rewrite
            // history whenever somebody is renamed, deleted or changes role.
            'actor_name' => $actor ? $actor->full_name : 'System',
            'actor_role' => $actor?->getRoleNames()->first(),

            'ip_address' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 255),
            'status' => $status,
        ]);

        return $activity;
    }

    /** Convenience wrapper for authentication events. */
    public function logAuth(string $action, string $description, ?User $actor = null, string $status = 'success'): Activity
    {
        return $this->log(
            module: 'auth',
            action: $action,
            description: $description,
            actor: $actor,
            status: $status,
        );
    }
}
