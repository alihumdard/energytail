<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Session keys that hold a login, e.g. login_web_<hash>.
     *
     * Within one test the framework keeps the user resolved from an earlier
     * request, so assertGuest() and a follow-up request both report a signed-in
     * user even after a successful logout. The session is where the login
     * actually lives, so tests assert on these keys instead.
     *
     * @return array<int, string>
     */
    protected function loginSessionKeys(): array
    {
        return collect(session()->all())
            ->keys()
            ->filter(fn (string $key) => str_starts_with($key, 'login_'))
            ->values()
            ->all();
    }
}
