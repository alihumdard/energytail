<?php

declare(strict_types=1);

namespace App\Services\Auth;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Verifies a CAPTCHA token with Google reCAPTCHA or hCaptcha.
 *
 * Supports both because the plan names neither, and the two APIs are close
 * enough that keeping the choice in config costs almost nothing.
 */
class CaptchaVerifier
{
    public function enabled(): bool
    {
        return (bool) Config::get('captcha.enabled', false);
    }

    /**
     * @param  string|null  $token  From the widget on the form.
     * @param  string|null  $ip  The submitting address, which both providers accept as a hint.
     */
    public function verify(?string $token, ?string $ip = null): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        $secret = Config::get('captcha.secret');

        if (blank($secret)) {
            /*
             * Enabled without a secret cannot be treated as a pass. Doing so
             * would leave the forms advertising protection they do not have,
             * and the failure would be invisible.
             */
            throw new RuntimeException(
                'CAPTCHA is enabled but CAPTCHA_SECRET is not set.'
            );
        }

        if (blank($token)) {
            return false;
        }

        $provider = (string) Config::get('captcha.provider', 'recaptcha');
        $endpoint = Config::get("captcha.endpoints.{$provider}");

        if (blank($endpoint)) {
            throw new RuntimeException("Unknown CAPTCHA provider [{$provider}].");
        }

        try {
            $response = Http::asForm()
                ->timeout((int) Config::get('captcha.timeout', 5))
                ->post($endpoint, array_filter([
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]));
        } catch (Throwable $e) {
            // Provider unreachable. Refuse rather than wave the request
            // through, so an outage cannot be used as a way past the check.
            Log::warning('CAPTCHA verification request failed.', [
                'provider' => $provider,
                'exception' => $e->getMessage(),
            ]);

            return false;
        }

        if (! $response->successful()) {
            return false;
        }

        $body = $response->json();

        if (($body['success'] ?? false) !== true) {
            return false;
        }

        // reCAPTCHA v3 scores rather than passing or failing outright; v2 and
        // hCaptcha omit the field, in which case success alone is the answer.
        if (array_key_exists('score', $body)) {
            return (float) $body['score'] >= (float) Config::get('captcha.minimum_score', 0.5);
        }

        return true;
    }
}
