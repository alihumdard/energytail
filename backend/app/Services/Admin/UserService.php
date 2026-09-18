<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'name' => trim("{$data['first_name']} {$data['last_name']}"),
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password'] ?? Str::random(32)),
                'status' => $data['status'] ?? 'active',
            ]);

            // Admin-created accounts are verified on creation: an
            // administrator vouching for the address is the verification.
            if ($data['email_verified'] ?? true) {
                $user->markEmailAsVerified();
            }

            $user->syncRoles([$data['role']]);

            $this->audit->log('users', 'created', "Created user {$user->email}", $user);

            return $user;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->fill(array_filter([
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
            ], fn ($value) => $value !== null));

            if (isset($data['first_name']) || isset($data['last_name'])) {
                $user->name = trim("{$user->first_name} {$user->last_name}");
            }

            // Changing the address invalidates its verification: the new
            // mailbox has not been proven to belong to this user.
            if ($user->isDirty('email')) {
                $user->email_verified_at = null;
            }

            /*
             * Applied after the email check above, so an administrator who
             * corrects an address and confirms it in one edit gets the
             * result they asked for rather than having it reset underneath
             * them.
             */
            if (array_key_exists('email_verified', $data)) {
                $user->email_verified_at = $data['email_verified']
                    ? ($user->email_verified_at ?? now())
                    : null;
            }

            $user->save();

            if (isset($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            $this->audit->log('users', 'updated', "Updated user {$user->email}", $user);

            return $user->fresh();
        });
    }

    /**
     * @throws ValidationException
     */
    public function suspend(User $user, ?string $reason, User $actor): User
    {
        $this->guardAgainstSelfAction($user, $actor, 'suspend');
        $this->guardAgainstLastAdministrator($user, 'suspend');

        $user->forceFill([
            'status' => 'suspended',
            'suspended_reason' => $reason,
            'suspended_at' => now(),
        ])->save();

        // Ends every active session immediately rather than letting the
        // suspended user continue until their token expires.
        $user->tokens()->delete();

        $this->audit->log('users', 'suspended', "Suspended user {$user->email}", $user, $actor);

        return $user;
    }

    public function reactivate(User $user, User $actor): User
    {
        $user->forceFill([
            'status' => 'active',
            'suspended_reason' => null,
            'suspended_at' => null,
        ])->save();

        $this->audit->log('users', 'reactivated', "Reactivated user {$user->email}", $user, $actor);

        return $user;
    }

    /**
     * @throws ValidationException
     */
    public function delete(User $user, User $actor): void
    {
        $this->guardAgainstSelfAction($user, $actor, 'delete');
        $this->guardAgainstLastAdministrator($user, 'delete');

        $email = $user->email;

        // Soft delete: audit rows and authored content reference this user,
        // and a hard delete would orphan them.
        $user->delete();

        $this->audit->log('users', 'deleted', "Deleted user {$email}", null, $actor);
    }

    /**
     * @throws ValidationException
     */
    private function guardAgainstSelfAction(User $user, User $actor, string $action): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages([
                'user' => ["You cannot {$action} your own account."],
            ]);
        }
    }

    /**
     * Stops the last administrator being removed, which would leave nobody
     * able to administer the platform.
     *
     * @throws ValidationException
     */
    private function guardAgainstLastAdministrator(User $user, string $action): void
    {
        if (! $user->hasRole('administrator')) {
            return;
        }

        $remaining = User::role('administrator')
            ->where('status', 'active')
            ->whereKeyNot($user->getKey())
            ->count();

        if ($remaining === 0) {
            throw ValidationException::withMessages([
                'user' => ["This is the last active administrator and cannot be {$action}d."],
            ]);
        }
    }
}
