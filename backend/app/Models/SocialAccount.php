<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'provider', 'provider_user_id', 'provider_email',
        'avatar_url', 'access_token', 'refresh_token', 'token_expires_at',
    ];

    /** OAuth tokens must never appear in an API response. */
    protected $hidden = ['access_token', 'refresh_token'];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            // Encrypted at rest: a leaked database dump should not hand an
            // attacker working Google or LinkedIn tokens.
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
