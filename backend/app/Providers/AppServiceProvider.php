<?php

namespace App\Providers;

use App\Listeners\LogAuthenticationEvents;
use App\Models\ArticleCategory;
use App\Models\City;
use App\Models\Country;
use App\Models\Industry;
use App\Models\JobCategory;
use App\Models\Skill;
use App\Models\Tag;
use App\Observers\TaxonomyCacheObserver;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->registerObservers();
        $this->registerAuthAuditListeners();
    }

    /**
     * Authentication events feed the audit log's "Auth" module, which the
     * admin screen shows alongside model changes.
     */
    private function registerAuthAuditListeners(): void
    {
        Event::listen(Login::class, [LogAuthenticationEvents::class, 'handleLogin']);
        Event::listen(Logout::class, [LogAuthenticationEvents::class, 'handleLogout']);
        Event::listen(Failed::class, [LogAuthenticationEvents::class, 'handleFailed']);
        Event::listen(Registered::class, [LogAuthenticationEvents::class, 'handleRegistered']);
        Event::listen(Verified::class, [LogAuthenticationEvents::class, 'handleVerified']);
        Event::listen(PasswordReset::class, [LogAuthenticationEvents::class, 'handlePasswordReset']);
    }

    /**
     * Taxonomy edits invalidate the public caches, so an admin change shows
     * on the frontend immediately rather than after the TTL expires.
     */
    private function registerObservers(): void
    {
        foreach ([
            Country::class, City::class, Industry::class,
            JobCategory::class, ArticleCategory::class, Skill::class, Tag::class,
        ] as $model) {
            $model::observe(TaxonomyCacheObserver::class);
        }
    }

    private function configureRateLimiting(): void
    {
        /*
         * Guards the credential endpoints: login, register, password reset
         * and social sign-in. Keyed on email plus IP rather than IP alone, so
         * several people behind one office NAT do not lock each other out
         * while a single account still cannot be brute-forced.
         */
        RateLimiter::for('auth', function (Request $request) {
            $email = mb_strtolower((string) $request->input('email', ''));
            $key = $email !== '' ? $email.'|'.$request->ip() : (string) $request->ip();

            return Limit::perMinute(5)->by($key)->response(function () {
                return response()->json([
                    'message' => 'Too many attempts. Please wait a minute and try again.',
                    'code' => 'too_many_requests',
                ], 429);
            });
        });

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)
            ->by($request->user()?->id ?: $request->ip()));
    }
}
