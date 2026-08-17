<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property User $owner
 * @property string $status
 */
class Company extends Model
{
    use HasFactory, SoftDeletes;

    /** Admin moderation states. */
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'owner_id', 'name', 'slug', 'email', 'phone', 'website',
        'industry_id', 'country_id', 'city_id', 'address', 'description',
        'logo_path', 'cover_path', 'company_size', 'size_min', 'founded_year',
        'status', 'is_verified', 'is_featured', 'meta_title', 'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_featured' => 'boolean',
            'verified_at' => 'datetime',
            'jobs_count' => 'integer',
            'founded_year' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** Everyone who may act for this company, owner included. */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function socials(): HasMany
    {
        return $this->hasMany(CompanySocial::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }

    /** Live listings shown on the public company page. */
    public function publishedJobs(): HasMany
    {
        return $this->jobs()->where('status', Job::STATUS_PUBLISHED);
    }

    /** Only companies the public directory should list. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
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
