<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Clears the public taxonomy caches whenever an admin edits reference data.
 *
 * Without this, deactivating a country would keep it visible on the public
 * site for up to an hour, which reads as a bug rather than a cache.
 *
 * The array cache driver used in tests has no tag support, and the database
 * driver in dev does not either, so keys are cleared explicitly rather than
 * through cache tags.
 */
class TaxonomyCacheObserver
{
    private const KEYS = [
        'public.countries',
        'public.cities.all',
        'public.industries',
        'public.job_categories',
        'public.article_categories',
        'public.skills',
        'public.tags',
        'public.taxonomies.all',
    ];

    public function saved(Model $model): void
    {
        $this->flush($model);
    }

    public function deleted(Model $model): void
    {
        $this->flush($model);
    }

    private function flush(Model $model): void
    {
        foreach (self::KEYS as $key) {
            Cache::forget($key);
        }

        // City lists are cached per country, so the affected country's entry
        // has to go too.
        if ($model->getTable() === 'cities' && $model->getAttribute('country_id')) {
            Cache::forget('public.cities.'.$model->getAttribute('country_id'));
        }
    }
}
