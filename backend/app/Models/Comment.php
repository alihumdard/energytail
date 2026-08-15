<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property User|null $user Null for guest comments, where guest_name is used.
 * @property string|null $guest_name
 * @property string $status
 */
class Comment extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_SPAM = 'spam';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'article_id', 'parent_id', 'user_id', 'guest_name', 'guest_email',
        'body', 'status', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'moderated_at' => 'datetime',
            'reports_count' => 'integer',
        ];
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(CommentReport::class);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /** Display name for the comment author, guest or registered. */
    public function authorName(): string
    {
        if ($this->user !== null) {
            return $this->user->full_name;
        }

        return (string) $this->guest_name;
    }
}
