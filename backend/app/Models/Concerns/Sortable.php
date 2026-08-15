<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Shared behaviour for the admin-managed taxonomy models (countries, cities,
 * industries, categories, skills, tags). They all carry an is_active flag and
 * a sort_order the admin controls, and the public API always filters and
 * orders by those two columns.
 */
trait Sortable
{
    /** Only rows the public site should see. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /** Admin-defined order, falling back to alphabetical for equal weights. */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
