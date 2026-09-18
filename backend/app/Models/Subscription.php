<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property int $plan_id
 * @property string|null $stripe_subscription_id
 * @property string|null $stripe_customer_id
 * @property string $status
 * @property Carbon|null $current_period_start
 * @property Carbon|null $current_period_end
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $cancels_at
 * @property Carbon|null $cancelled_at
 * @property int $jobs_used
 * @property int $featured_used
 * @property Plan|null $plan
 * @property Company|null $company
 */
class Subscription extends Model
{
    use HasFactory;

    /*
     * Stripe's own status vocabulary. Mirrored rather than translated so a
     * webhook can set the value directly, and so a mismatch between the two
     * systems stays visible instead of being hidden by a mapping table.
     */
    public const STATUS_INCOMPLETE = 'incomplete';

    public const STATUS_TRIALING = 'trialing';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PAST_DUE = 'past_due';

    public const STATUS_CANCELED = 'canceled';

    public const STATUS_UNPAID = 'unpaid';

    protected $fillable = [
        'company_id', 'plan_id', 'created_by', 'stripe_subscription_id',
        'stripe_customer_id', 'status', 'current_period_start',
        'current_period_end', 'trial_ends_at', 'cancels_at', 'cancelled_at',
        'jobs_used', 'featured_used',
    ];

    protected function casts(): array
    {
        return [
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'trial_ends_at' => 'datetime',
            'cancels_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'jobs_used' => 'integer',
            'featured_used' => 'integer',
        ];
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<Plan, $this> */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Whether this subscription currently entitles the company to anything.
     *
     * past_due counts as valid on purpose: a card that failed this morning
     * should not take an employer's live listings down before Stripe has
     * finished retrying it.
     */
    public function isValid(): bool
    {
        return in_array($this->status, [
            self::STATUS_ACTIVE,
            self::STATUS_TRIALING,
            self::STATUS_PAST_DUE,
        ], true);
    }

    /** Whether the employer has cancelled but the paid period is still running. */
    public function onGracePeriod(): bool
    {
        return $this->cancels_at !== null && $this->cancels_at->isFuture();
    }

    /** Postings left this period; null when the plan is unlimited. */
    public function jobsRemaining(): ?int
    {
        $limit = $this->plan?->job_limit;

        if ($limit === null) {
            return null;
        }

        return max(0, $limit - $this->jobs_used);
    }

    /** Featured slots left this period. */
    public function featuredRemaining(): int
    {
        return max(0, ($this->plan->featured_job_limit ?? 0) - $this->featured_used);
    }

    public function canPostJob(): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        $remaining = $this->jobsRemaining();

        return $remaining === null || $remaining > 0;
    }

    public function scopeValid(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_ACTIVE,
            self::STATUS_TRIALING,
            self::STATUS_PAST_DUE,
        ]);
    }
}
