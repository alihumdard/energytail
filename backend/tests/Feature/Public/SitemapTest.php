<?php

use App\Models\Article;
use App\Models\Company;
use App\Models\Country;
use App\Models\Job;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;
use Illuminate\Support\Collection;

use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);

    // The sitemap is cached; a stale entry from another test would make the
    // assertions here meaningless.
    cache()->clear();

    $this->company = Company::factory()->create(['status' => Company::STATUS_ACTIVE]);
});

it('is readable by a guest', function () {
    getJson('/api/v1/sitemap')
        ->assertOk()
        ->assertJsonStructure(['data' => ['jobs', 'companies', 'articles', 'taxonomies']]);
});

it('lists a published job', function () {
    Job::factory()->for($this->company)->create([
        'slug' => 'live-job',
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'deadline_at' => now()->addMonth(),
    ]);

    expect(jobSlugs())->toContain('live-job');
});

/*
 * The point of the endpoint is that it cannot advertise a URL the public
 * pages would 404 on. Each of these is a record the detail page refuses to
 * serve, so each must be absent here too.
 */
it('hides a draft job', function () {
    Job::factory()->for($this->company)->create([
        'slug' => 'draft-job',
        'status' => Job::STATUS_DRAFT,
        'published_at' => null,
    ]);

    expect(jobSlugs())->not->toContain('draft-job');
});

it('hides a job whose deadline has passed', function () {
    Job::factory()->for($this->company)->create([
        'slug' => 'expired-job',
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now()->subMonth(),
        'deadline_at' => now()->subDay(),
    ]);

    expect(jobSlugs())->not->toContain('expired-job');
});

it('hides a job scheduled for the future', function () {
    Job::factory()->for($this->company)->create([
        'slug' => 'future-job',
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now()->addWeek(),
    ]);

    expect(jobSlugs())->not->toContain('future-job');
});

it('hides a company that is not active', function () {
    $suspended = Company::factory()->create([
        'slug' => 'suspended-co',
        'status' => Company::STATUS_SUSPENDED,
    ]);

    $slugs = collect(getJson('/api/v1/sitemap')->json('data.companies'))->pluck('slug');

    expect($slugs)->not->toContain('suspended-co')
        ->and($slugs)->toContain($this->company->slug);

    expect($suspended->status)->toBe(Company::STATUS_SUSPENDED);
});

it('hides an unpublished article', function () {
    Article::factory()->create([
        'slug' => 'pending-article',
        'status' => Article::STATUS_PENDING_REVIEW,
        'published_at' => null,
    ]);

    $slugs = collect(getJson('/api/v1/sitemap')->json('data.articles'))->pluck('slug');

    expect($slugs)->not->toContain('pending-article');
});

/*
 * Taxonomies are only worth a URL while something lives under them: an empty
 * results page is a thin page, and offering one to a crawler costs more than
 * the URL earns.
 */
it('omits taxonomies that have no live job', function () {
    $job = Job::factory()->for($this->company)->create([
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'deadline_at' => now()->addMonth(),
    ]);

    $countries = getJson('/api/v1/sitemap')->json('data.taxonomies.countries');

    expect($countries)->toContain($job->country->slug)
        // The seeder ships far more countries than the single job uses.
        ->and(count($countries))->toBeLessThan(Country::count());
});

/** Slugs of every job the sitemap advertises. */
function jobSlugs(): Collection
{
    return collect(getJson('/api/v1/sitemap')->json('data.jobs'))->pluck('slug');
}
