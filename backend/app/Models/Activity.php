<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

/**
 * Extends Spatie's activity with the context the audit log screen filters on.
 *
 * @property string|null $module
 * @property string|null $action
 * @property string|null $actor_name
 * @property string|null $actor_role
 * @property string|null $ip_address
 * @property string $status
 */
class Activity extends SpatieActivity
{
    protected $fillable = [
        'log_name', 'description', 'subject_type', 'subject_id',
        'causer_type', 'causer_id', 'properties', 'event', 'batch_uuid',
        'module', 'action', 'actor_name', 'actor_role',
        'ip_address', 'user_agent', 'status',
    ];

    public function scopeForModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }

    public function scopeForAction(Builder $query, string $action): Builder
    {
        return $query->where('action', $action);
    }
}
