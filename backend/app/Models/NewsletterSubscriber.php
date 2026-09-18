<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsletterSubscriber extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_UNSUBSCRIBED = 'unsubscribed';

    protected $fillable = [
        'email', 'name', 'user_id', 'status',
        'confirmation_token', 'source', 'ip_address',
        // Written when a subscriber confirms or leaves; without these here
        // both timestamps are silently dropped on save.
        'confirmed_at', 'unsubscribed_at',
    ];

    /** The token is the only thing guarding the confirm link. */
    protected $hidden = ['confirmation_token'];

    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Only confirmed subscribers may be mailed. Sending to pending rows would
     * mean mailing addresses that never completed double opt-in.
     */
    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }
}
