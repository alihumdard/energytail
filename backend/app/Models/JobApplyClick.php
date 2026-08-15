<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplyClick extends Model
{
    use HasFactory;

    /** Append-only event rows; clicked_at is the only timestamp that matters. */
    public $timestamps = false;

    protected $fillable = [
        'job_id', 'user_id', 'visitor_hash', 'ip_address', 'referrer',
        'country_code', 'apply_method', 'is_suspected_bot', 'clicked_at',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
            'is_suspected_bot' => 'boolean',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Excludes traffic flagged by bot filtering. Every figure reported to an
     * employer should go through this scope — inflated click counts would
     * misrepresent the value the platform delivers.
     */
    public function scopeGenuine(Builder $query): Builder
    {
        return $query->where('is_suspected_bot', false);
    }
}
