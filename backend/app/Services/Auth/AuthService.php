<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Creates an account and assigns its platform role.
     *
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'status' => 'active',
            ]);

            $user->assignRole($data['role']);

            // Sends the verification email through Laravel's listener.
            event(new Registered($user));

            return $user;
        });
    }

    /**
     * Verifies credentials and account standing.
     *
     * @throws ValidationException
     */
    public function attemptLogin(string $email, string $password): User
    {
        $user = User::where('email', $email)->first();

        // One message for both "no such user" and "wrong password", so the
        // response cannot be used to discover which emails are registered.
        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if ($user->isSuspended()) {
            throw ValidationException::withMessages([
                'email' => ['This account has been suspended. Contact support for help.'],
            ]);
        }

        if ($user->trashed()) {
            throw ValidationException::withMessages([
                'email' => ['This account is no longer active.'],
            ]);
        }

        return $user;
    }

    /** Records sign-in metadata for the admin users screen and audit log. */
    public function recordLogin(User $user, Request $request): void
    {
        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();
    }

    public function changePassword(User $user, string $newPassword): void
    {
        $user->forceFill(['password' => Hash::make($newPassword)])->save();

        // Invalidate every issued API token: a password change should end
        // sessions on other devices, which is what a user expects when they
        // change it because they suspect compromise.
        $user->tokens()->delete();
    }
}
