<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string|null $description
 * @property string|null $stripe_product_id
 * @property string|null $stripe_price_id
 * @property int $price_cents
 * @property string $currency
 * @property string $interval
 * @property int|null $job_limit
 * @property int $featured_job_limit
 * @property int $job_duration_days
 * @property bool $is_active
 * @property bool $is_popular
 * @property int $sort_order
 */
class Plan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'description', 'stripe_product_id', 'stripe_price_id',
        'price_cents', 'currency', 'interval', 'job_limit', 'featured_job_limit',
        'job_duration_days', 'is_active', 'is_popular', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'job_limit' => 'integer',
            'featured_job_limit' => 'integer',
            'job_duration_days' => 'integer',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Whether this plan costs nothing — a free tier, not a broken price. */
    public function isFree(): bool
    {
        return $this->price_cents === 0;
    }

    /** Unlimited postings are null, which is not the same as zero. */
    public function hasUnlimitedJobs(): bool
    {
        return $this->job_limit === null;
    }

    /** The price as a decimal, for display only — never for arithmetic. */
    public function priceInMajorUnits(): float
    {
        return $this->price_cents / 100;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
