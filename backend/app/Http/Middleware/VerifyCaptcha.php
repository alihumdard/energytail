<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\Auth\CaptchaVerifier;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rejects a public form submission whose CAPTCHA token does not check out.
 *
 * Reported as a validation error against 'captcha' so the frontend can render
 * it the same way it renders every other field error, and so a failure tells
 * the user to try the challenge again rather than showing a bare 403.
 */
class VerifyCaptcha
{
    public function __construct(private readonly CaptchaVerifier $captcha) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->captcha->enabled()) {
            return $next($request);
        }

        $token = $request->input('captcha_token');

        if (! $this->captcha->verify(is_string($token) ? $token : null, $request->ip())) {
            throw ValidationException::withMessages([
                'captcha' => ['Could not verify that you are human. Please try again.'],
            ]);
        }

        return $next($request);
    }
}
