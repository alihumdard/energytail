<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | CAPTCHA
    |--------------------------------------------------------------------------
    |
    | Bot protection on the public auth forms, which the plan lists under
    | Security alongside rate limiting.
    |
    | Disabled by default so local development and the test suite do not need
    | live keys. Turning it on without a secret is treated as misconfiguration
    | and fails loudly rather than silently letting every request through —
    | a CAPTCHA that always passes is worse than none, because it looks like
    | protection.
    |
    */

    'enabled' => env('CAPTCHA_ENABLED', false),

    /*
    | 'recaptcha' expects Google reCAPTCHA v3 keys; 'hcaptcha' expects hCaptcha
    | keys. Both verify over HTTP and return a score or a pass/fail.
    */
    'provider' => env('CAPTCHA_PROVIDER', 'recaptcha'),

    'site_key' => env('CAPTCHA_SITE_KEY'),

    'secret' => env('CAPTCHA_SECRET'),

    /*
    | reCAPTCHA v3 returns a score from 0.0 (almost certainly a bot) to 1.0.
    | 0.5 is Google's suggested starting point. Ignored by hCaptcha, which
    | answers pass/fail.
    */
    'minimum_score' => (float) env('CAPTCHA_MINIMUM_SCORE', 0.5),

    'endpoints' => [
        'recaptcha' => 'https://www.google.com/recaptcha/api/siteverify',
        'hcaptcha' => 'https://api.hcaptcha.com/siteverify',
    ],

    /*
    | Seconds to wait on the provider. Kept short: if the verification service
    | is slow, failing the request beats holding a sign-up open.
    */
    'timeout' => (int) env('CAPTCHA_TIMEOUT', 5),

];
