<?php

namespace App\Models;

use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * Extends Spatie's permission with the module/action split.
 *
 * Storing these as columns rather than parsing the "module.action" name means
 * the matrix screen can group rows without string manipulation.
 *
 * @property string $name
 * @property string|null $module
 * @property string|null $action
 * @property string|null $label
 */
class Permission extends SpatiePermission
{
    protected $fillable = [
        'name', 'module', 'action', 'label', 'guard_name',
    ];

    /** Pinned to 'web' for the same reason as Role — see App\Models\Role. */
    protected $attributes = [
        'guard_name' => 'web',
    ];

    public function __construct(array $attributes = [])
    {
        $attributes['guard_name'] ??= 'web';

        parent::__construct($attributes);
    }
}
