<?php

use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Job;
use App\Models\JobCategory;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);

    $this->admin = User::factory()->role('administrator')->create();
    $this->seeker = User::factory()->role('job_seeker')->create();
});

// ------------------------------------------------------------------ access

it('refuses admin taxonomy endpoints to guests', function (string $resource) {
    getJson("/api/v1/admin/{$resource}")->assertUnauthorized();
})->with(['industries', 'countries', 'cities', 'skills', 'tags', 'job-categories']);

it('refuses admin taxonomy endpoints without the permission', function () {
    actingAs($this->seeker)
        ->getJson('/api/v1/admin/countries')
        ->assertForbidden()
        ->assertJsonPath('code', 'forbidden');
});

// -------------------------------------------------------------------- read

it('lists each taxonomy with pagination', function (string $resource) {
    $response = actingAs($this->admin)
        ->getJson("/api/v1/admin/{$resource}?per_page=5")
        ->assertOk()
        ->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);

    expect($response->json('meta.per_page'))->toBe(5)
        ->and(count($response->json('data')))->toBeLessThanOrEqual(5);
})->with(['industries', 'countries', 'cities', 'skills', 'tags', 'job-categories', 'article-categories']);

it('searches by name', function () {
    $data = actingAs($this->admin)
        ->getJson('/api/v1/admin/countries?search=United')
        ->assertOk()
        ->json('data');

    expect($data)->not->toBeEmpty();

    foreach ($data as $row) {
        expect($row['name'])->toContain('United');
    }
});

it('searches case insensitively', function () {
    $lower = actingAs($this->admin)->getJson('/api/v1/admin/countries?search=united')->json('data');
    $upper = actingAs($this->admin)->getJson('/api/v1/admin/countries?search=UNITED')->json('data');

    expect(count($lower))->toBe(count($upper))->and(count($lower))->toBeGreaterThan(0);
});

it('filters by active state', function () {
    Country::query()->limit(3)->update(['is_active' => false]);

    $inactive = actingAs($this->admin)
        ->getJson('/api/v1/admin/countries?is_active=0')->json('data');

    expect(count($inactive))->toBe(3);

    foreach ($inactive as $row) {
        expect($row['is_active'])->toBeFalse();
    }
});

it('rejects sorting by an arbitrary column', function () {
    // Falls back to the default ordering rather than passing the column
    // through to SQL.
    actingAs($this->admin)
        ->getJson('/api/v1/admin/countries?sort=password&direction=asc')
        ->assertOk();
});

it('caps the page size', function () {
    $meta = actingAs($this->admin)
        ->getJson('/api/v1/admin/cities?per_page=5000')
        ->assertOk()
        ->json('meta');

    // Otherwise a single request could ask for every row in the table.
    expect($meta['per_page'])->toBe(100);
});

it('includes the country on each city row', function () {
    $row = actingAs($this->admin)
        ->getJson('/api/v1/admin/cities')
        ->assertOk()
        ->json('data.0');

    expect($row['country'])->toHaveKeys(['id', 'name', 'code', 'flag_emoji']);
});

// ------------------------------------------------------------------- write

it('creates a record and derives its slug', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/industries', [
            'name' => 'Hydrogen & Fuel Cells',
            'description' => 'Green hydrogen production and storage.',
            'emoji' => '💧',
            'color' => '#0ea5e9',
        ])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'hydrogen-fuel-cells')
        ->assertJsonPath('data.is_active', true);
});

it('rejects a malformed colour', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/industries', [
            'name' => 'Test Industry',
            'color' => 'not-a-colour',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('color');
});

it('rejects a duplicate country code', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/countries', ['name' => 'Duplicate', 'code' => 'US'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('code');
});

it('uppercases country codes on save', function () {
    actingAs($this->admin)
        ->postJson('/api/v1/admin/countries', ['name' => 'Testland', 'code' => 'tl'])
        ->assertCreated()
        ->assertJsonPath('data.code', 'TL');
});

it('keeps the slug stable when a name is edited', function () {
    $industry = Industry::first();
    $originalSlug = $industry->slug;

    actingAs($this->admin)
        ->putJson("/api/v1/admin/industries/{$industry->id}", [
            'name' => 'Completely Renamed Industry',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Completely Renamed Industry')
        // Changing it would break the public landing page URL and any
        // inbound links to it.
        ->assertJsonPath('data.slug', $originalSlug);
});

it('refuses to make a category its own parent', function () {
    $category = JobCategory::first();

    actingAs($this->admin)
        ->putJson("/api/v1/admin/job-categories/{$category->id}", [
            'name' => $category->name,
            'parent_id' => $category->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('parent_id');
});

it('toggles the active flag', function () {
    $tag = Tag::first();

    expect($tag->is_active)->toBeTrue();

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/tags/{$tag->id}/active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/tags/{$tag->id}/active")
        ->assertOk()
        ->assertJsonPath('data.is_active', true);
});

it('reorders in one bulk request', function () {
    $industries = Industry::ordered()->limit(3)->get();

    actingAs($this->admin)
        ->postJson('/api/v1/admin/industries/reorder', [
            'order' => [
                ['id' => $industries[0]->id, 'sort_order' => 30],
                ['id' => $industries[1]->id, 'sort_order' => 20],
                ['id' => $industries[2]->id, 'sort_order' => 10],
            ],
        ])
        ->assertOk();

    expect(Industry::find($industries[2]->id)->sort_order)->toBe(10)
        ->and(Industry::find($industries[0]->id)->sort_order)->toBe(30);
});

it('reports that tags cannot be manually reordered', function () {
    // Tags rank by usage, so manual ordering would be overwritten anyway.
    actingAs($this->admin)
        ->postJson('/api/v1/admin/tags/reorder', [
            'order' => [['id' => Tag::first()->id, 'sort_order' => 1]],
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'not_supported');
});

// ------------------------------------------------------------------ delete

it('deletes an unused record', function () {
    $industry = Industry::create(['name' => 'Temp Industry', 'slug' => 'temp-industry']);

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/industries/{$industry->id}")
        ->assertOk();

    expect(Industry::find($industry->id))->toBeNull();
});

it('refuses to delete a record still in use and suggests deactivating', function () {
    $industry = Industry::first();
    $employer = User::factory()->role('employer')->create();

    $company = Company::factory()->create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
    ]);

    Job::factory()->create([
        'company_id' => $company->id,
        'industry_id' => $industry->id,
    ]);

    $response = actingAs($this->admin)
        ->deleteJson("/api/v1/admin/industries/{$industry->id}")
        ->assertStatus(422);

    expect($response->json('errors.id.0'))->toContain('Deactivate it instead');
    expect(Industry::find($industry->id))->not->toBeNull();
});

it('refuses to delete a country that still has cities', function () {
    $country = Country::whereHas('cities')->first();

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/countries/{$country->id}")
        ->assertStatus(422);
});

// ------------------------------------------------------------------- stats

it('returns stats, donut and top five for each taxonomy', function (string $resource) {
    $data = actingAs($this->admin)
        ->getJson("/api/v1/admin/{$resource}/stats")
        ->assertOk()
        ->json('data');

    expect($data['stats'])->toHaveKeys(['total', 'active', 'inactive'])
        ->and($data['stats']['total'])
        ->toBe($data['stats']['active'] + $data['stats']['inactive'])
        ->and($data)->toHaveKeys(['donut', 'top']);
})->with(['industries', 'countries', 'cities', 'skills', 'tags', 'job-categories']);

it('reports skill demand and tag usage in their stats', function () {
    $skills = actingAs($this->admin)->getJson('/api/v1/admin/skills/stats')->json('data.stats');
    $tags = actingAs($this->admin)->getJson('/api/v1/admin/tags/stats')->json('data.stats');

    expect($skills)->toHaveKey('in_demand')
        ->and($skills['in_demand'])->toBeGreaterThan(0)
        ->and($tags)->toHaveKeys(['in_use', 'assignments']);
});

it('keeps donut percentages summing to roughly one hundred', function () {
    $donut = actingAs($this->admin)
        ->getJson('/api/v1/admin/cities/stats')
        ->json('data.donut');

    $sum = array_sum(array_column($donut, 'pct'));

    // Rounding each slice can drift a little, but not far.
    expect($sum)->toBeGreaterThan(99.0)->and($sum)->toBeLessThan(101.0);
});

// ------------------------------------------------------------------ export

it('exports csv', function () {
    $response = actingAs($this->admin)->get('/api/v1/admin/countries/export');

    $response->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $csv = $response->streamedContent();

    expect($csv)->toContain('name')->toContain('United States');
});

it('refuses export without the export permission', function () {
    $employer = User::factory()->role('employer')->create();

    actingAs($employer)->get('/api/v1/admin/countries/export')->assertForbidden();
});
