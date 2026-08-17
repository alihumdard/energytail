<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Admin\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->with('roles');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('first_name', 'ilike', "%{$search}%")
                    ->orWhere('last_name', 'ilike', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->toString()) {
            $query->role($role);
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($request->has('verified')) {
            $request->boolean('verified')
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }

        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';

        $query->orderBy(
            in_array($sort, ['name', 'email', 'created_at', 'last_login_at', 'status'], true)
                ? $sort
                : 'created_at',
            $direction
        );

        $users = $query->paginate(min(100, max(1, $request->integer('per_page', 15))));

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

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json(['data' => new UserResource($user->load('roles'))]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create($request->validated());

        return response()->json([
            'message' => 'User created.',
            'data' => new UserResource($user->load('roles')),
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->users->update($user, $request->validated());

        return response()->json([
            'message' => 'User updated.',
            'data' => new UserResource($user->load('roles')),
        ]);
    }

    /** Suspend or reactivate, driven by the status toggle on the users table. */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'status' => ['required', 'in:active,suspended'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $actor = $request->user();

        $user = $validated['status'] === 'suspended'
            ? $this->users->suspend($user, $validated['reason'] ?? null, $actor)
            : $this->users->reactivate($user, $actor);

        return response()->json([
            'message' => $user->status === 'suspended' ? 'User suspended.' : 'User reactivated.',
            'data' => new UserResource($user->load('roles')),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->users->delete($user, $request->user());

        return response()->json(['message' => 'User deleted.']);
    }

    /** Sends a reset link rather than setting a password on the user's behalf. */
    public function sendPasswordReset(User $user): JsonResponse
    {
        $this->authorize('update', $user);

        Password::sendResetLink(['email' => $user->email]);

        return response()->json(['message' => 'Password reset link sent.']);
    }

    /** Counts for the stats strip on the users screen. */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json([
            'data' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'suspended' => User::where('status', 'suspended')->count(),
                'unverified' => User::whereNull('email_verified_at')->count(),
                'by_role' => User::query()
                    ->join('model_has_roles', 'model_has_roles.model_id', '=', 'users.id')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->selectRaw('roles.name as role, roles.label, count(*) as total')
                    ->groupBy('roles.name', 'roles.label', 'roles.sort_order')
                    ->orderBy('roles.sort_order')
                    ->get(),
                'recent_signups' => User::where('created_at', '>=', now()->subDays(30))->count(),
            ],
        ]);
    }

    public function export(): StreamedResponse
    {
        $this->authorize('export', User::class);

        $users = User::with('roles')->get();

        return response()->streamDownload(function () use ($users) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'ID', 'First Name', 'Last Name', 'Email', 'Phone',
                'Role', 'Status', 'Verified', 'Last Login', 'Joined',
            ]);

            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->id,
                    $user->first_name,
                    $user->last_name,
                    $user->email,
                    $user->phone,
                    $user->getRoleNames()->first(),
                    $user->status,
                    $user->email_verified_at ? 'yes' : 'no',
                    $user->last_login_at?->toDateTimeString(),
                    $user->created_at?->toDateTimeString(),
                ]);
            }

            fclose($handle);
        }, 'users.csv', ['Content-Type' => 'text/csv']);
    }
}
