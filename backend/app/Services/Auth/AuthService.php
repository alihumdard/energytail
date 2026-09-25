<?php

namespace App\Services\Auth;

use App\Models\Company;
use Illuminate\Http\UploadedFile;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthService
{
    /**
     * Creates an account and assigns its platform role.
     *
     * @param  array<string, mixed>  $data
     */
    public function register(array $data): User
    {
        $user = DB::transaction(function () use ($data) {
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

            if ($data['role'] === 'employer') {
                $this->createCompanyFor($user, $data);
            }

            return $user;
        });

        /*
         * Fired after the transaction commits, and never allowed to fail the
         * request. Inside the transaction an SMTP outage rolled the account
         * back, so a mail problem read to the user as "registration failed"
         * and left them unable to retry with the same address. The account is
         * the thing worth keeping; the email can be resent.
         */
        try {
            event(new Registered($user));
        } catch (Throwable $e) {
            Log::error('Verification email failed to send on registration.', [
                'user_id' => $user->id,
                'exception' => $e->getMessage(),
            ]);
        }

        return $user;
    }

    /**
     * Creates the company an employer will post jobs under.
     *
     * Made at sign-up rather than left for later so an employer account never
     * exists with nothing behind it. It starts pending: the plan asks for no
     * approval gate on employers themselves, but a company profile should not
     * appear in public listings before anyone has filled it in.
     *
     * @param  array<string, mixed>  $data
     */
    private function createCompanyFor(User $user, array $data): void
    {
        $name = trim((string) ($data['company_name'] ?? ''));

        if ($name === '') {
            return;
        }

        $base = Str::slug($name);
        $slug = $base;

        // Two employers may legitimately register the same company name, and
        // the slug is the public URL, so it has to stay unique.
        for ($suffix = 2; Company::query()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        Company::create([
            'owner_id' => $user->id,
            'name' => $name,
            'slug' => $slug,
            'email' => $user->email,
            'website' => $data['company_website'] ?? null,
            // Optional at sign-up; the company profile can set it later.
            'logo_path' => ($data['company_logo'] ?? null) instanceof UploadedFile
                ? $data['company_logo']->store('companies', 'public')
                : null,
            'status' => Company::STATUS_PENDING,
        ]);
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
            $this->fail($email, $user, 'These credentials do not match our records.');
        }

        /*
         * Account-standing failures carry a code the frontend can branch on.
         * Every message arrives against the 'email' field, so without one the
         * form cannot tell "wrong password" — where retrying makes sense —
         * from a suspension, where it never will.
         */
        if ($user->isSuspended()) {
            $this->fail(
                $email,
                $user,
                'This account has been suspended. Contact support for help.',
                'account_suspended',
            );
        }

        if ($user->trashed()) {
            $this->fail($email, $user, 'This account is no longer active.', 'account_closed');
        }

        return $user;
    }

    /**
     * Rejects a sign-in attempt, announcing it first.
     *
     * The Failed event is what puts the attempt in the audit log. Without it
     * a brute-force run would leave no trace, since every attempt is a plain
     * validation error as far as the HTTP layer is concerned.
     *
     * @throws ValidationException
     */
    private function fail(
        string $email,
        ?User $user,
        string $message,
        ?string $code = null,
    ): never {
        event(new Failed('web', $user, ['email' => $email]));

        $exception = ValidationException::withMessages(['email' => [$message]]);

        if ($code !== null) {
            $exception->response = response()->json([
                'message' => $message,
                'code' => $code,
                'errors' => ['email' => [$message]],
            ], 422);
        }

        throw $exception;
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
