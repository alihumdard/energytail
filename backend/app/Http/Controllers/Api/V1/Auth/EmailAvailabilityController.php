<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Tells the registration form whether an address is already registered, so a
 * user finds out while typing rather than after submitting a filled-in form.
 *
 * This is a limited disclosure: anyone can already learn the same thing from
 * the sign-up form itself, which must reject a duplicate address. It is
 * throttled so it cannot be used to enumerate a list of members, and it
 * deliberately returns nothing about the account beyond whether the address
 * is free.
 */
class EmailAvailabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
        ]);

        $email = mb_strtolower(trim($validated['email']));

        $taken = User::query()->where('email', $email)->exists();

        return response()->json([
            'data' => [
                'email' => $email,
                'available' => ! $taken,
            ],
        ]);
    }
}
