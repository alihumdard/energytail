<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeekerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'headline', 'summary', 'country_id', 'city_id',
        'job_category_id', 'industry_id', 'experience_years',
        'expected_salary_min', 'expected_salary_max', 'expected_salary_currency',
        'salary_period', 'availability', 'open_to_remote', 'open_to_relocation',
        'website', 'linkedin_url', 'visibility', 'completeness',
    ];

    protected function casts(): array
    {
        return [
            'open_to_remote' => 'boolean',
            'open_to_relocation' => 'boolean',
            'completeness' => 'integer',
            'expected_salary_min' => 'decimal:2',
            'expected_salary_max' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'job_category_id');
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }
}
