<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Extends Spatie's role with the metadata the admin screen needs.
 *
 * 'name' stays the machine key used in permission checks (job_seeker), while
 * 'label' carries the display name — so renaming a role for display can never
 * break an authorisation check.
 *
 * @property string $name
 * @property string|null $label
 * @property string|null $description
 * @property bool $is_system
 * @property int $sort_order
 * @property Carbon|null $created_at
 */
class Role extends SpatieRole
{
    protected $fillable = [
        'name', 'label', 'description', 'is_system', 'sort_order', 'guard_name',
    ];

    /**
     * Every role and permission belongs to the 'web' guard.
     *
     * Sanctum's SPA mode authenticates through the web guard, so a single
     * guard covers both browser and token clients. Pinning it here rather
     * than letting Spatie infer it matters because inference picks the first
     * guard whose provider maps to the User model — with both 'web' and
     * 'sanctum' configured that choice is not stable, and a role created
     * under one guard is invisible to checks made under the other.
     */
    protected $attributes = [
        'guard_name' => 'web',
    ];

    public function __construct(array $attributes = [])
    {
        $attributes['guard_name'] ??= 'web';

        parent::__construct($attributes);
    }

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * System roles are seeded and cannot be deleted or renamed. Deleting
     * Administrator would lock every admin out of the platform.
     */
    public function isSystem(): bool
    {
        return $this->is_system === true;
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function getRouteKeyName(): string
    {
        return 'id';
    }
}
