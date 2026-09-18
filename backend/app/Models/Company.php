<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $website
 * @property string|null $description
 * @property string|null $address
 * @property string|null $logo_path
 * @property string|null $company_size
 * @property int|null $founded_year
 * @property int|null $industry_id
 * @property int|null $country_id
 * @property int|null $city_id
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property bool $is_verified
 * @property bool $is_featured
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property int|null $jobs_count
 * @property User $owner
 * @property Industry|null $industry
 * @property Country|null $country
 * @property City|null $city
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
        // Set alongside is_verified when an administrator verifies a company;
        // without it here the timestamp is silently dropped on save.
        'verified_at',
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

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Everyone who may act for this company, owner included.
     *
     * @return BelongsToMany<User, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
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

    /** @return HasMany<CompanySocial, $this> */
    public function socials(): HasMany
    {
        return $this->hasMany(CompanySocial::class);
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<Job, $this> */
    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class);
    }

    /**
     * Live listings shown on the public company page.
     *
     * @return HasMany<Job, $this>
     */
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
