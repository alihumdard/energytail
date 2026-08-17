<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    /**
     * All permissions, grouped by module.
     *
     * Grouping happens here rather than in the frontend so the ordering and
     * labels stay consistent with config/authorization.php.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $modules = config('authorization.modules');

        /** @var array<string, array<string, mixed>> $grouped */
        $grouped = [];

        foreach (Permission::orderBy('module')->orderBy('id')->get() as $permission) {
            $module = (string) $permission->module;

            $grouped[$module] ??= [
                'module' => $module,
                'label' => $modules[$module]['label'] ?? $module,
                'description' => $modules[$module]['description'] ?? null,
                'permissions' => [],
            ];

            $grouped[$module]['permissions'][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'action' => $permission->action,
                'label' => $permission->label,
            ];
        }

        return response()->json(['data' => array_values($grouped)]);
    }
}
