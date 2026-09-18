<?php

use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);

    $this->company = Company::factory()->create();

    $this->job = Job::factory()->for($this->company)->create([
        'title' => 'Senior Drilling Engineer',
        'slug' => 'senior-drilling-engineer',
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'deadline_at' => now()->addMonth(),
        'apply_method' => 'external_url',
        'apply_url' => 'https://employer.example/careers/123',
    ]);
});

// ------------------------------------------------------------------ access

it('lets a guest search jobs', function () {
    // Search has to work signed-out: it is the surface the SEO plan depends
    // on, and a crawler arrives with no session.
    getJson('/api/v1/jobs')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.title', 'Senior Drilling Engineer');
});

it('hides jobs that are not published', function (string $status) {
    $this->job->update(['status' => $status]);

    getJson('/api/v1/jobs')->assertOk()->assertJsonPath('meta.total', 0);

    // Absent rather than forbidden: whether a draft exists is not public.
    getJson('/api/v1/jobs/senior-drilling-engineer')->assertNotFound();
})->with([
    Job::STATUS_DRAFT,
    Job::STATUS_PENDING_REVIEW,
    Job::STATUS_CLOSED,
]);

it('hides a job whose deadline has passed', function () {
    $this->job->update(['deadline_at' => now()->subDay()]);

    getJson('/api/v1/jobs')->assertOk()->assertJsonPath('meta.total', 0);
});

// ----------------------------------------------------------------- detail

it('returns a job by slug with its relations', function () {
    getJson('/api/v1/jobs/senior-drilling-engineer')
        ->assertOk()
        ->assertJsonPath('data.title', 'Senior Drilling Engineer')
        ->assertJsonPath('data.company.slug', $this->company->slug)
        ->assertJsonStructure(['data' => ['description', 'requirements', 'skills', 'tags']]);
});

it('never exposes the apply destination in the job payload', function () {
    $payload = getJson('/api/v1/jobs/senior-drilling-engineer')->assertOk()->json('data');

    /*
     * The destination comes only from the apply endpoint, which records the
     * click first. Publishing it here would let the link be scraped straight
     * out of the page and leave the employer's click figures wrong.
     */
    expect($payload)->not->toHaveKey('apply_url')
        ->and($payload)->not->toHaveKey('apply_email')
        ->and($payload['apply_method'])->toBe('external_url');
});

it('withholds a salary the employer chose to hide', function () {
    $this->job->update([
        'salary_is_hidden' => true,
        'salary_min' => 90000,
        'salary_max' => 120000,
    ]);

    // Null rather than a partial figure: neither bound should leak.
    expect(getJson('/api/v1/jobs/senior-drilling-engineer')->json('data.salary'))->toBeNull();
});

it('counts a view once per visitor per day', function () {
    getJson('/api/v1/jobs/senior-drilling-engineer')->assertOk();
    $after = $this->job->fresh()->views_count;

    getJson('/api/v1/jobs/senior-drilling-engineer')->assertOk();

    // A refresh must not inflate the figure the employer is shown.
    expect($this->job->fresh()->views_count)->toBe($after);
});

// ---------------------------------------------------------------- filters

it('filters by country slug', function () {
    $other = Job::factory()->for($this->company)->create([
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now(),
        'country_id' => $this->job->country_id,
    ]);

    $slug = $this->job->country->slug;

    getJson("/api/v1/jobs?country={$slug}")
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    getJson('/api/v1/jobs?country=nowhere-at-all')
        ->assertOk()
        ->assertJsonPath('meta.total', 0);

    expect($other->exists)->toBeTrue();
});

it('filters by keyword across title and company name', function () {
    getJson('/api/v1/jobs?search=drilling')->assertOk()->assertJsonPath('meta.total', 1);
    getJson('/api/v1/jobs?search=nonsense')->assertOk()->assertJsonPath('meta.total', 0);
});

it('excludes hidden salaries from a salary filter', function () {
    $this->job->update([
        'salary_is_hidden' => true,
        'salary_min' => 200000,
        'salary_max' => 250000,
    ]);

    // The job pays well above the floor, but its salary is withheld — it
    // cannot be judged against the filter, so it must not be returned.
    getJson('/api/v1/jobs?salary_min=100000')->assertOk()->assertJsonPath('meta.total', 0);
});

it('puts featured jobs first', function () {
    $featured = Job::factory()->for($this->company)->create([
        'title' => 'Featured Role',
        'status' => Job::STATUS_PUBLISHED,
        // Published earlier, so only the featured flag can lift it.
        'published_at' => now()->subWeek(),
        'is_featured' => true,
    ]);

    expect(getJson('/api/v1/jobs')->json('data.0.slug'))->toBe($featured->slug);
});

it('never repeats a job across pages', function () {
    $shared = now()->subDay();

    Job::factory()->count(12)->for($this->company)->create([
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => $shared,
    ]);

    $seen = collect([1, 2, 3])->flatMap(
        fn (int $page) => getJson("/api/v1/jobs?per_page=5&page={$page}")->json('data.*.id')
    );

    expect($seen)->toHaveCount($seen->unique()->count());
});

// ------------------------------------------------------------------ apply

it('refuses an apply click from a guest', function () {
    postJson('/api/v1/jobs/senior-drilling-engineer/apply')->assertUnauthorized();
});

it('refuses an apply click from an unverified account', function () {
    $seeker = User::factory()->unverified()->role('job_seeker')->create();

    // The plan closes applying to unconfirmed accounts; browsing stays open.
    actingAs($seeker)
        ->postJson('/api/v1/jobs/senior-drilling-engineer/apply')
        ->assertForbidden()
        ->assertJsonPath('code', 'email_not_verified');
});

it('returns the employer destination and records the click', function () {
    $seeker = User::factory()->role('job_seeker')->create();

    actingAs($seeker)
        ->postJson('/api/v1/jobs/senior-drilling-engineer/apply')
        ->assertOk()
        ->assertJsonPath('data.method', 'external_url')
        ->assertJsonPath('data.target', 'https://employer.example/careers/123');

    expect($this->job->applyClicks()->count())->toBe(1);
});

it('counts one candidate once however many times they click', function () {
    $seeker = User::factory()->role('job_seeker')->create();

    $before = $this->job->fresh()->apply_clicks_count;

    actingAs($seeker)->postJson('/api/v1/jobs/senior-drilling-engineer/apply')->assertOk();
    actingAs($seeker)->postJson('/api/v1/jobs/senior-drilling-engineer/apply')->assertOk();

    /*
     * Coming back and clicking again is the same interest, not two. Counting
     * every press would let a listing look twice as effective as it was.
     */
    expect($this->job->applyClicks()->count())->toBe(1)
        ->and($this->job->fresh()->apply_clicks_count)->toBe($before + 1);
});

it('explains itself when the employer set no way to apply', function () {
    $this->job->update(['apply_url' => null, 'apply_email' => null]);

    $seeker = User::factory()->role('job_seeker')->create();

    actingAs($seeker)
        ->postJson('/api/v1/jobs/senior-drilling-engineer/apply')
        ->assertStatus(422)
        ->assertJsonPath('code', 'no_apply_target');
});
