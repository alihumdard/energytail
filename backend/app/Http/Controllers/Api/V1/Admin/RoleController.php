<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\SyncRolePermissionsRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Services\Admin\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(private readonly RoleService $roles) {}

    /** Roles list for the left-hand panel of the matrix screen. */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::withCount(['users', 'permissions'])->ordered()->get();

        return response()->json(['data' => RoleResource::collection($roles)]);
    }

    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $role->loadCount('users')->load('permissions');

        return response()->json(['data' => new RoleResource($role)]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roles->create($request->validated());

        return response()->json([
            'message' => 'Role created.',
            'data' => new RoleResource($role->load('permissions')),
        ], 201);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $role = $this->roles->update($role, $request->validated());

        return response()->json([
            'message' => 'Role updated.',
            'data' => new RoleResource($role),
        ]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        $this->roles->delete($role);

        return response()->json(['message' => 'Role deleted.']);
    }

    /**
     * The matrix definition: modules, actions, and which cells apply.
     * Rendered as the grid on the Roles & Permissions screen.
     */
    public function matrix(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        return response()->json(['data' => $this->roles->matrix()]);
    }

    /** Saves the whole grid in one request. */
    public function syncPermissions(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        $role = $this->roles->syncPermissions($role, $request->validated('permissions'));

        return response()->json([
            'message' => 'Permissions updated.',
            'data' => new RoleResource($role),
        ]);
    }

    /** Users holding this role — the "Users" tab on the detail panel. */
    public function users(Request $request, Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $users = $role->users()
            ->paginate((int) $request->integer('per_page', 15));

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
