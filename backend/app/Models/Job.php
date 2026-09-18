<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A job listing — the platform's core entity.
 *
 * Note this is NOT Laravel's queue table; that was renamed to queue_jobs in
 * config/queue.php so the domain could own the 'jobs' name.
 *
 * @property Carbon|null $deadline_at
 * @property Carbon|null $published_at
 * @property Carbon|null $closed_at
 * @property string $status
 * @property string $apply_method
 * @property string|null $apply_url
 * @property string|null $apply_email
 */
class Job extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_CLOSED = 'closed';

    /** Applications leave the platform — these are the two exit routes. */
    public const APPLY_EXTERNAL_URL = 'external_url';

    public const APPLY_EMAIL = 'email';

    protected $fillable = [
        'reference', 'company_id', 'posted_by', 'title', 'slug',
        'job_category_id', 'industry_id', 'country_id', 'city_id', 'location_label',
        'employment_type', 'is_remote', 'description', 'responsibilities',
        'requirements', 'benefits', 'experience_min', 'experience_max',
        'salary_min', 'salary_max', 'salary_currency', 'salary_period',
        'salary_is_hidden', 'apply_method', 'apply_url', 'apply_email',
        'status', 'is_featured', 'is_urgent', 'is_highlighted',
        // closed_at belongs here with the other lifecycle timestamps: closing
        // a job sets it, and reopening clears it. Left out, both writes were
        // dropped silently and a closed listing carried no record of when.
        'published_at', 'deadline_at', 'closed_at', 'meta_title', 'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'is_remote' => 'boolean',
            'is_featured' => 'boolean',
            'is_urgent' => 'boolean',
            'is_highlighted' => 'boolean',
            'salary_is_hidden' => 'boolean',
            'published_at' => 'datetime',
            'closed_at' => 'datetime',
            'deadline_at' => 'date',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
            'views_count' => 'integer',
            'apply_clicks_count' => 'integer',
        ];
    }

    // ------------------------------------------------------- relationships

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<User, $this> */
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /** @return BelongsTo<JobCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'job_category_id');
    }

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    /** @return BelongsTo<Country, $this> */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /** @return BelongsToMany<Skill, $this> */
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'job_skill')
            ->withPivot(['is_required', 'sort_order']);
    }

    /** @return MorphToMany<Tag, $this> */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable')->withTimestamps();
    }

    /** @return HasMany<JobView, $this> */
    public function views(): HasMany
    {
        return $this->hasMany(JobView::class);
    }

    /** @return HasMany<JobApplyClick, $this> */
    public function applyClicks(): HasMany
    {
        return $this->hasMany(JobApplyClick::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function savedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_jobs')
            ->withPivot('note')
            ->withTimestamps();
    }

    // -------------------------------------------------------------- scopes

    /** Live and visible to the public: published and not past its deadline. */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereNull('deadline_at')->orWhere('deadline_at', '>=', now()->toDateString());
        });
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    // ------------------------------------------------------------ helpers

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    public function hasExpired(): bool
    {
        return $this->deadline_at !== null && $this->deadline_at->isPast();
    }

    /** Where the apply button should send the candidate. */
    public function applyTarget(): ?string
    {
        return $this->apply_method === self::APPLY_EMAIL
            ? $this->apply_email
            : $this->apply_url;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
