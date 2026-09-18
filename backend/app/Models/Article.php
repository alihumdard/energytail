<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property string|null $body
 * @property string|null $featured_image_path
 * @property int|null $article_category_id
 * @property int|null $author_id
 * @property int|null $reading_minutes
 * @property int $views_count
 * @property int $comments_count
 * @property string|null $review_notes
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property bool $is_featured
 * @property bool $is_sponsored
 * @property bool $comments_enabled
 * @property Carbon|null $published_at
 * @property Carbon|null $reviewed_at
 * @property Carbon|null $created_at
 * @property User|null $author
 * @property User|null $reviewer
 * @property ArticleCategory|null $category
 * @property string $status
 */
class Article extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'author_id', 'article_category_id', 'title', 'slug', 'excerpt', 'body',
        'featured_image_path', 'featured_image_alt', 'status',
        'published_at', 'scheduled_for', 'is_featured', 'is_sponsored',
        'comments_enabled', 'reading_minutes', 'meta_title', 'meta_description',
        /*
         * Written when a moderator approves or rejects. Without these here the
         * reviewer, the timestamp and the rejection reason are all silently
         * dropped on save — leaving no record of who decided what, or why.
         */
        'reviewed_by', 'reviewed_at', 'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'is_sponsored' => 'boolean',
            'comments_enabled' => 'boolean',
            'published_at' => 'datetime',
            'scheduled_for' => 'datetime',
            'reviewed_at' => 'datetime',
            'autosaved_at' => 'datetime',
            'views_count' => 'integer',
            'comments_count' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsTo<ArticleCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ArticleCategory::class, 'article_category_id');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** @return MorphToMany<Tag, $this> */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->withTimestamps();
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Top-level approved comments; replies are nested under each one.
     *
     * @return HasMany<Comment, $this>
     */
    public function approvedComments(): HasMany
    {
        return $this->comments()
            ->whereNull('parent_id')
            ->where('status', Comment::STATUS_APPROVED);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
