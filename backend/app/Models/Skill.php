<?php

namespace App\Models;

use App\Models\Concerns\Sortable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Skill extends Model
{
    use HasFactory, SoftDeletes, Sortable;

    protected $fillable = [
        'name', 'slug', 'category', 'icon', 'color',
        'demand_level', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function jobs(): BelongsToMany
    {
        return $this->belongsToMany(Job::class, 'job_skill')
            ->withPivot(['is_required', 'sort_order']);
    }

    public function seekers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'seeker_skill')
            ->withPivot(['proficiency', 'years_experience', 'sort_order']);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
