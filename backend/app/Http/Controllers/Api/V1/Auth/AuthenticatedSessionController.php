<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticatedSessionController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function store(LoginRequest $request): JsonResponse
    {
        $user = $this->auth->attemptLogin(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        Auth::login($user, $request->boolean('remember'));

        // Rotates the session id so a fixation attempt cannot survive login.
        $request->session()->regenerate();

        $this->auth->recordLogin($user, $request);

        return response()->json([
            'message' => 'Signed in.',
            'data' => new UserResource($user),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        // A bearer-token client signs out by revoking the token it presented;
        // there is no session to tear down in that case.
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        // Cookie clients sign out by destroying the session. Logging out of
        // the 'web' guard alone is not enough: the sanctum guard re-resolves
        // the user from the session cookie on the next request, so the
        // session itself has to be invalidated.
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Signed out.']);
    }

    /** The current user, used by the frontend to restore session state. */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($request->user())]);
    }
}
