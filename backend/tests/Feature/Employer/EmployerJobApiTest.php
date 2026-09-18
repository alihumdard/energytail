<?php

use App\Models\Company;
use App\Models\Country;
use App\Models\Job;
use App\Models\JobCategory;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);
    $this->seed(SettingSeeder::class);

    Setting::flushCache();

    $this->employer = User::factory()->role('employer')->create();
    $this->company = Company::factory()->create(['owner_id' => $this->employer->id]);

    $this->rival = User::factory()->role('employer')->create();
    $this->rivalCompany = Company::factory()->create(['owner_id' => $this->rival->id]);
});

/** A payload the validator accepts. */
function jobPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Subsea Systems Engineer',
        'description' => str_repeat('Design and commission subsea production systems. ', 3),
        'job_category_id' => JobCategory::first()->id,
        'country_id' => Country::first()->id,
        'employment_type' => 'full_time',
        'apply_method' => 'external_url',
        'apply_url' => 'https://employer.example/careers/subsea',
    ], $overrides);
}

// ------------------------------------------------------------------ access

it('refuses the employer workspace to guests', function () {
    $this->getJson('/api/v1/employer/jobs')->assertUnauthorized();
});

it('refuses posting from an unverified account', function () {
    $unverified = User::factory()->unverified()->role('employer')->create();
    Company::factory()->create(['owner_id' => $unverified->id]);

    // A listing is public content carrying a company's name, so the same
    // verification gate applies as to applying.
    actingAs($unverified)
        ->postJson('/api/v1/employer/jobs', jobPayload())
        ->assertForbidden()
        ->assertJsonPath('code', 'email_not_verified');
});

it('refuses posting from a job seeker', function () {
    actingAs(User::factory()->role('job_seeker')->create())
        ->postJson('/api/v1/employer/jobs', jobPayload())
        ->assertForbidden();
});

// --------------------------------------------------------------- ownership

it('lists only the jobs of companies the employer acts for', function () {
    Job::factory()->count(3)->for($this->company)->create();
    Job::factory()->count(4)->for($this->rivalCompany)->create();

    $response = actingAs($this->employer)
        ->getJson('/api/v1/employer/jobs?per_page=50')
        ->assertOk();

    /*
     * Scoped by the query, not only by a per-row policy check. A listing that
     * returned everything and withheld each row would still leak a rival's
     * draft count through the pagination totals.
     */
    expect($response->json('meta.total'))->toBe(3);
});

it('refuses to show, edit or close a rival company job', function () {
    $job = Job::factory()->for($this->rivalCompany)->create();

    actingAs($this->employer)->getJson("/api/v1/employer/jobs/{$job->id}")->assertForbidden();
    actingAs($this->employer)->putJson("/api/v1/employer/jobs/{$job->id}", jobPayload())->assertForbidden();
    actingAs($this->employer)->patchJson("/api/v1/employer/jobs/{$job->id}/close")->assertForbidden();

    expect($job->fresh()->title)->not->toBe('Subsea Systems Engineer');
});

it('lets a colleague on the company act for it', function () {
    $colleague = User::factory()->role('employer')->create();

    // The company_user pivot is how an owner brings a recruiter in; they are
    // as entitled to post as the person who registered.
    $colleague->companies()->attach($this->company->id, ['role' => 'recruiter']);

    actingAs($colleague)->postJson('/api/v1/employer/jobs', jobPayload())->assertCreated();

    expect($this->company->jobs()->count())->toBe(1);
});

it('refuses to post without a company to post under', function () {
    $orphan = User::factory()->role('employer')->create();

    actingAs($orphan)->postJson('/api/v1/employer/jobs', jobPayload())->assertForbidden();
});

// ------------------------------------------------------------------- write

it('publishes a job immediately when approval is off', function () {
    Setting::query()->where('key', 'jobs_require_approval')->update(['value' => '0']);
    Setting::flushCache();

    $data = actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload())
        ->assertCreated()
        ->json('data');

    expect($data['status'])->toBe(Job::STATUS_PUBLISHED)
        ->and($data['reference'])->toStartWith('ET-');

    // Live on the public board with no further action.
    $this->getJson('/api/v1/jobs?search=Subsea')->assertJsonPath('meta.total', 1);
});

it('holds a job for review when approval is on', function () {
    Setting::query()->where('key', 'jobs_require_approval')->update(['value' => '1']);
    Setting::flushCache();

    $data = actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload())
        ->assertCreated()
        ->json('data');

    expect($data['status'])->toBe(Job::STATUS_PENDING_REVIEW);

    // And stays off the public board until a moderator acts.
    $this->getJson('/api/v1/jobs?search=Subsea')->assertJsonPath('meta.total', 0);
});

it('sends an edited job back for review when approval is on', function () {
    Setting::query()->where('key', 'jobs_require_approval')->update(['value' => '1']);
    Setting::flushCache();

    $job = Job::factory()->for($this->company)->create(['status' => Job::STATUS_PUBLISHED]);

    actingAs($this->employer)
        ->putJson("/api/v1/employer/jobs/{$job->id}", jobPayload(['title' => 'Rewritten']))
        ->assertOk();

    /*
     * Otherwise an employer could publish something innocuous, wait for
     * approval, then rewrite it into whatever they liked.
     */
    expect($job->fresh()->status)->toBe(Job::STATUS_PENDING_REVIEW);
});

it('never lets an employer set featured or urgent', function () {
    $data = actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload([
            'is_featured' => true,
            'is_urgent' => true,
        ]))
        ->assertCreated()
        ->json('data');

    // Both are sold placements in the plan, set by the package a job is
    // posted under — never by the form.
    expect($data['is_featured'])->toBeFalse();
});

it('requires somewhere to send candidates', function () {
    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload(['apply_url' => null]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('apply_url');

    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload([
            'apply_method' => 'email',
            'apply_url' => null,
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('apply_email');
});

it('rejects a salary range that runs backwards', function () {
    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', jobPayload([
            'salary_min' => 150000,
            'salary_max' => 90000,
        ]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('salary_max');
});

// ----------------------------------------------------------- close / reopen

it('closes a job without losing its history', function () {
    $job = Job::factory()->for($this->company)->create([
        'status' => Job::STATUS_PUBLISHED,
        'views_count' => 400,
        'apply_clicks_count' => 25,
    ]);

    actingAs($this->employer)
        ->patchJson("/api/v1/employer/jobs/{$job->id}/close")
        ->assertOk();

    $job->refresh();

    // Closed rather than deleted: the employer paid for those clicks and the
    // analytics report on them.
    expect($job->status)->toBe(Job::STATUS_CLOSED)
        ->and($job->closed_at)->not->toBeNull()
        ->and($job->views_count)->toBe(400)
        ->and($job->apply_clicks_count)->toBe(25);
});

it('pushes the deadline out when reopening an expired job', function () {
    $job = Job::factory()->for($this->company)->create([
        'status' => Job::STATUS_EXPIRED,
        'deadline_at' => now()->subWeek(),
    ]);

    actingAs($this->employer)
        ->patchJson("/api/v1/employer/jobs/{$job->id}/reopen")
        ->assertOk();

    // Otherwise it would publish straight back into the expired bucket.
    expect($job->fresh()->deadline_at->isFuture())->toBeTrue();
});

it('reports counts and performance for the dashboard', function () {
    Job::factory()->count(2)->for($this->company)->create([
        'status' => Job::STATUS_PUBLISHED,
        'views_count' => 100,
        'apply_clicks_count' => 5,
    ]);
    // A draft has never been public, so it has no views to contribute — the
    // factory would otherwise hand it a random figure.
    Job::factory()->for($this->company)->create([
        'status' => Job::STATUS_DRAFT,
        'views_count' => 0,
        'apply_clicks_count' => 0,
    ]);

    Job::factory()->for($this->rivalCompany)->create(['views_count' => 9999]);

    $data = actingAs($this->employer)
        ->getJson('/api/v1/employer/jobs/stats')
        ->assertOk()
        ->json('data');

    expect($data['total'])->toBe(3)
        ->and($data['published'])->toBe(2)
        ->and($data['draft'])->toBe(1)
        // A rival's traffic must not appear in these totals.
        ->and($data['views'])->toBe(200)
        ->and($data['apply_clicks'])->toBe(10);
});
