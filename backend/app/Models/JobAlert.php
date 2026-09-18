<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $keywords
 * @property int|null $job_category_id
 * @property int|null $industry_id
 * @property int|null $country_id
 * @property int|null $city_id
 * @property string|null $employment_type
 * @property bool $is_remote
 * @property string|null $salary_min
 * @property string $frequency
 * @property bool $is_active
 * @property Carbon|null $last_sent_at
 * @property Carbon|null $created_at
 * @property JobCategory|null $category
 * @property Industry|null $industry
 * @property Country|null $country
 * @property City|null $city
 */
class JobAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'keywords', 'job_category_id', 'industry_id',
        'country_id', 'city_id', 'employment_type', 'is_remote',
        'salary_min', 'frequency', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_remote' => 'boolean',
            'last_sent_at' => 'datetime',
            'salary_min' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<JobCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'job_category_id');
    }

    /** @return BelongsTo<Country, $this> */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /*
     * industry_id and city_id are columns on job_alerts and part of the
     * filter set, but neither relation existed — an alert could store them
     * and never resolve them for display.
     */

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    /** @return BelongsTo<City, $this> */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
