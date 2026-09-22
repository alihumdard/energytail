<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class SocialAuthController extends Controller
{
    public function __construct(private readonly SocialAuthService $social) {}

    /**
     * Sends the user to Google or LinkedIn to authorise.
     *
     * Socialite returns Symfony's RedirectResponse rather than Laravel's, so
     * the return type covers the parent class both extend.
     */
    public function redirect(Request $request, string $provider): JsonResponse|SymfonyRedirectResponse
    {
        if (! $this->social->isSupported($provider)) {
            return response()->json([
                'message' => "Sign-in with {$provider} is not available.",
                'code' => 'unsupported_provider',
            ], 404);
        }

        // The role chosen on the register screen has to survive the round trip
        // to the provider, so it rides in the session rather than the URL,
        // where a user could tamper with it.
        $role = $request->string('role')->toString();

        if (in_array($role, ['job_seeker', 'employer', 'author'], true)) {
            $request->session()->put('social_signup_role', $role);
        }

        return Socialite::driver($this->social->driverFor($provider))->redirect();
    }

    /** Handles the provider callback and signs the user in. */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        if (! $this->social->isSupported($provider)) {
            return redirect()->away("{$frontend}/login?error=unsupported_provider");
        }

        try {
            $socialiteUser = Socialite::driver($this->social->driverFor($provider))->user();

            $user = $this->social->findOrCreateUser(
                $provider,
                $socialiteUser,
                $request->session()->pull('social_signup_role', 'job_seeker'),
            );
        } catch (Throwable $e) {
            report($e);

            return redirect()->away("{$frontend}/login?error=social_failed");
        }

        if ($user->isSuspended()) {
            return redirect()->away("{$frontend}/login?error=account_suspended");
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()->away("{$frontend}/auth/callback?status=success");
    }
}
