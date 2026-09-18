<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    private const CACHE_KEY = 'settings.all';

    protected $fillable = [
        'group', 'key', 'value', 'type', 'is_public', 'description', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['is_public' => 'boolean'];
    }

    /**
     * Values are stored as text but represent several types. Casting happens
     * here rather than at every call site, so a caller reading a boolean
     * setting never has to remember it arrives as the string "1".
     */
    public function typedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'json' => json_decode((string) $this->value, true),
            default => $this->value,
        };
    }

    /**
     * Reads one setting by key, already cast to its declared type.
     *
     * Cached because settings are read on paths that run per request — every
     * job posted consults the moderation switch — while changing rarely. The
     * admin screen clears this on save, so an edit takes effect at once
     * rather than after a timeout.
     */
    public static function value(string $key, mixed $default = null): mixed
    {
        $settings = Cache::rememberForever(self::CACHE_KEY, fn () => self::query()
            ->get(['key', 'value', 'type'])
            ->mapWithKeys(fn (self $setting) => [$setting->key => $setting->typedValue()])
            ->all());

        return $settings[$key] ?? $default;
    }

    /** Called after any write, so a saved setting is read back immediately. */
    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** Settings safe to expose to unauthenticated clients. */
    public function scopePublic(Builder $query): Builder
    {
        return $query->where('is_public', true);
    }

    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }

    public function getRouteKeyName(): string
    {
        return 'key';
    }
}
