<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A webhook Stripe sent us.
 *
 * The unique event_id is what makes handling idempotent: Stripe retries until
 * it receives a 2xx and can redeliver even after success, so the same
 * invoice.paid must never extend a subscription twice.
 *
 * @property int $id
 * @property string $provider
 * @property string $event_id
 * @property string $type
 * @property array<string, mixed> $payload
 * @property Carbon|null $processed_at
 * @property string|null $error
 */
class WebhookEvent extends Model
{
    protected $fillable = [
        'provider', 'event_id', 'type', 'payload', 'processed_at', 'error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }
}
