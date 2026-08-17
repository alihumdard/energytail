<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function store(RegisterRequest $request): JsonResponse
    {
        $user = $this->auth->register($request->validated());

        // Sign in immediately so the frontend can move straight to the
        // "verify your email" screen in an authenticated state.
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Account created. Check your email to verify your address.',
            'data' => new UserResource($user),
        ], 201);
    }
}
