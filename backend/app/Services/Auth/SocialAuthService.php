<?php

namespace App\Services\Auth;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use RuntimeException;

class SocialAuthService
{
    /** Public provider names mapped to their Socialite driver. */
    private const DRIVERS = [
        'google' => 'google',
        'linkedin' => 'linkedin-openid',
    ];

    public function isSupported(string $provider): bool
    {
        return array_key_exists($provider, self::DRIVERS);
    }

    public function driverFor(string $provider): string
    {
        return self::DRIVERS[$provider]
            ?? throw new RuntimeException("Unsupported social provider [{$provider}].");
    }

    /**
     * Resolves a Socialite identity to a local account.
     *
     * Three cases, in order:
     *   1. The provider identity is already linked — sign that user in.
     *   2. A local account owns the provider's verified email — link to it,
     *      rather than creating a duplicate the user cannot reconcile.
     *   3. Nobody matches — create an account with the requested role.
     */
    public function findOrCreateUser(
        string $provider,
        SocialiteUser $socialiteUser,
        string $defaultRole = 'job_seeker',
    ): User {
        $email = $socialiteUser->getEmail();

        if (! $email) {
            // Without an email there is no safe way to match or contact the
            // account, and every downstream feature assumes one exists.
            throw new RuntimeException(
                'This provider did not share an email address. Register with an email instead.'
            );
        }

        $email = mb_strtolower(trim($email));

        return DB::transaction(function () use ($provider, $socialiteUser, $email, $defaultRole) {
            $existingLink = SocialAccount::where('provider', $provider)
                ->where('provider_user_id', $socialiteUser->getId())
                ->first();

            if ($existingLink) {
                $this->refreshTokens($existingLink, $socialiteUser);

                return $existingLink->user;
            }

            // withTrashed(): a soft-deleted account still owns its email, and
            // a plain lookup can't see past that scope — it would try to
            // insert a fresh row and collide with the unique constraint the
            // trashed one still holds.
            $user = User::withTrashed()->where('email', $email)->first();

            if ($user && $user->trashed()) {
                $user->restore();
            } elseif (! $user) {
                $user = $this->createFromSocialite($socialiteUser, $email, $defaultRole);
            }

            $this->linkAccount($user, $provider, $socialiteUser, $email);

            return $user;
        });
    }

    private function createFromSocialite(
        SocialiteUser $socialiteUser,
        string $email,
        string $defaultRole,
    ): User {
        [$firstName, $lastName] = $this->splitName($socialiteUser->getName() ?: $email);

        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $socialiteUser->getName() ?: $firstName,
            'email' => $email,
            // A random password the user never learns; they sign in through
            // the provider, or set one via the password reset flow.
            'password' => bcrypt(Str::random(40)),
            'status' => 'active',
        ]);

        // Set outside the create() call on purpose: email_verified_at is not
        // mass assignable, so that request input can never mark an address
        // verified. Here the provider has already confirmed it, which makes a
        // second verification email redundant friction.
        $user->markEmailAsVerified();

        $user->assignRole($defaultRole);

        return $user;
    }

    private function linkAccount(
        User $user,
        string $provider,
        SocialiteUser $socialiteUser,
        string $email,
    ): void {
        SocialAccount::updateOrCreate(
            ['provider' => $provider, 'provider_user_id' => $socialiteUser->getId()],
            [
                'user_id' => $user->id,
                'provider_email' => $email,
                'avatar_url' => $socialiteUser->getAvatar(),
                'access_token' => $socialiteUser->token ?? null,
                'refresh_token' => $socialiteUser->refreshToken ?? null,
                'token_expires_at' => isset($socialiteUser->expiresIn)
                    ? now()->addSeconds((int) $socialiteUser->expiresIn)
                    : null,
            ]
        );
    }

    private function refreshTokens(SocialAccount $account, SocialiteUser $socialiteUser): void
    {
        $account->update([
            'access_token' => $socialiteUser->token ?? $account->access_token,
            'refresh_token' => $socialiteUser->refreshToken ?? $account->refresh_token,
            'token_expires_at' => isset($socialiteUser->expiresIn)
                ? now()->addSeconds((int) $socialiteUser->expiresIn)
                : $account->token_expires_at,
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName), 2) ?: [];

        return [$parts[0] ?? '', $parts[1] ?? ''];
    }
}
