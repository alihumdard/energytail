<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Renders every API exception into a single predictable JSON envelope:
 *
 *     {
 *       "message": "Human readable summary.",
 *       "code": "validation_failed",
 *       "errors": { "email": ["The email field is required."] }
 *     }
 *
 * `errors` is present only for validation failures. `code` is a stable machine
 * readable slug the frontend can branch on without matching message text.
 */
class ApiExceptionRenderer
{
    public function __invoke(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*') && ! $request->expectsJson()) {
            return null;
        }

        // Middleware and validators signal an already-built response by
        // throwing this. Returning null hands it back to Laravel, which sends
        // the response as intended — the rate limiter's 429 reaches the client
        // this way instead of being reclassified as a 500.
        if ($e instanceof HttpResponseException) {
            return null;
        }

        [$status, $code, $message] = $this->classify($e);

        $payload = [
            'message' => $message,
            'code' => $code,
        ];

        if ($e instanceof ValidationException) {
            $payload['errors'] = $e->errors();
        }

        // Only leak internals in local/debug. Production returns the generic
        // message set in classify() so stack traces never reach a client.
        if (config('app.debug') && $status >= 500) {
            $payload['debug'] = [
                'exception' => $e::class,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
        }

        return response()->json($payload, $status);
    }

    /**
     * @return array{0: int, 1: string, 2: string}
     */
    private function classify(Throwable $e): array
    {
        return match (true) {
            $e instanceof ValidationException => [
                422, 'validation_failed', 'The given data was invalid.',
            ],
            $e instanceof AuthenticationException => [
                401, 'unauthenticated', 'Authentication is required to access this resource.',
            ],
            $e instanceof AuthorizationException => [
                403, 'forbidden', 'You do not have permission to perform this action.',
            ],
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => [
                404, 'not_found', 'The requested resource was not found.',
            ],
            $e instanceof HttpExceptionInterface => [
                $e->getStatusCode(),
                $this->slugForStatus($e->getStatusCode()),
                $e->getMessage() !== '' ? $e->getMessage() : $this->messageForStatus($e->getStatusCode()),
            ],
            default => [
                500, 'server_error', 'An unexpected error occurred.',
            ],
        };
    }

    private function slugForStatus(int $status): string
    {
        return match ($status) {
            // Laravel converts AuthorizationException into a plain
            // HttpException before custom renderers run, so 403 has to be
            // mapped here as well as in classify().
            401 => 'unauthenticated',
            403 => 'forbidden',
            404 => 'not_found',
            405 => 'method_not_allowed',
            409 => 'conflict',
            422 => 'validation_failed',
            429 => 'too_many_requests',
            503 => 'service_unavailable',
            default => 'http_error',
        };
    }

    private function messageForStatus(int $status): string
    {
        return match ($status) {
            405 => 'This method is not allowed for the requested resource.',
            409 => 'The request conflicts with the current state of the resource.',
            429 => 'Too many requests. Please slow down and try again shortly.',
            503 => 'The service is temporarily unavailable.',
            default => 'The request could not be completed.',
        };
    }
}
