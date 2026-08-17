<?php

use App\Models\City;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);
});

it('serves each taxonomy without authentication', function (string $path) {
    getJson("/api/v1/taxonomies/{$path}")
        ->assertOk()
        ->assertJsonStructure(['data']);
})->with([
    'countries', 'cities', 'industries',
    'job-categories', 'article-categories', 'skills', 'tags',
]);

it('returns everything a filter sidebar needs in one request', function () {
    getJson('/api/v1/taxonomies')
        ->assertOk()
        ->assertJsonStructure([
            'data' => ['countries', 'industries', 'job_categories', 'tags'],
        ]);
});

it('hides inactive records from the public site', function () {
    $country = Country::first();
    $country->update(['is_active' => false]);

    $names = collect(getJson('/api/v1/taxonomies/countries')->json('data'))
        ->pluck('name');

    // Deactivating is the admin's way of removing something from the
    // frontend without deleting it.
    expect($names)->not->toContain($country->name);
});

it('shows a record again once reactivated', function () {
    $country = Country::first();

    $country->update(['is_active' => false]);
    expect(collect(getJson('/api/v1/taxonomies/countries')->json('data'))->pluck('name'))
        ->not->toContain($country->name);

    $country->update(['is_active' => true]);

    // The cache must not keep serving the stale list.
    expect(collect(getJson('/api/v1/taxonomies/countries')->json('data'))->pluck('name'))
        ->toContain($country->name);
});

it('reflects an admin edit immediately rather than after the cache expires', function () {
    $admin = User::factory()->role('administrator')->create();

    // Warm the cache.
    getJson('/api/v1/taxonomies/industries')->assertOk();

    actingAs($admin)->postJson('/api/v1/admin/industries', [
        'name' => 'Geothermal Energy',
    ])->assertCreated();

    $names = collect(getJson('/api/v1/taxonomies/industries')->json('data'))->pluck('name');

    expect($names)->toContain('Geothermal Energy');
});

it('filters cities by country', function () {
    $country = Country::whereHas('cities')->first();

    $cities = getJson("/api/v1/taxonomies/cities?country_id={$country->id}")->json('data');

    expect($cities)->not->toBeEmpty();

    foreach ($cities as $city) {
        expect($city['country_id'])->toBe($country->id);
    }
});

it('invalidates the per-country city cache on edit', function () {
    $country = Country::whereHas('cities')->first();

    $before = count(getJson("/api/v1/taxonomies/cities?country_id={$country->id}")->json('data'));

    City::create([
        'country_id' => $country->id,
        'name' => 'Newly Added City',
        'slug' => 'newly-added-city',
    ]);

    $after = getJson("/api/v1/taxonomies/cities?country_id={$country->id}")->json('data');

    expect(count($after))->toBe($before + 1);
});

it('searches skills for the autocomplete', function () {
    $results = getJson('/api/v1/taxonomies/skills?search=drilling')->json('data');

    expect($results)->not->toBeEmpty();

    foreach ($results as $skill) {
        expect(strtolower($skill['name']))->toContain('drilling');
    }
});

it('excludes inactive skills from search results', function () {
    $skill = Skill::where('name', 'Well Control')->first();
    $skill->update(['is_active' => false]);

    $names = collect(getJson('/api/v1/taxonomies/skills?search=well')->json('data'))
        ->pluck('name');

    expect($names)->not->toContain('Well Control');
});

it('orders tags by usage', function () {
    $tags = getJson('/api/v1/taxonomies/tags')->json('data');
    $counts = array_column($tags, 'usage_count');
    $sorted = $counts;
    rsort($sorted);

    expect($counts)->toBe($sorted);
});

it('returns only the fields the frontend needs', function () {
    $country = getJson('/api/v1/taxonomies/countries')->json('data.0');

    // Trimmed deliberately: admin-only columns like sort_order and timestamps
    // have no use on the public site and only add payload weight.
    expect(array_keys($country))
        ->toBe(['id', 'name', 'slug', 'code', 'flag_emoji', 'region']);
});

it('does not leak inactive industries through the combined endpoint', function () {
    Industry::first()->update(['is_active' => false]);

    $count = count(getJson('/api/v1/taxonomies')->json('data.industries'));

    expect($count)->toBe(Industry::where('is_active', true)->count());
});
