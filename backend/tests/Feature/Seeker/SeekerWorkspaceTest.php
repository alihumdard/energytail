<?php

/*
 * The candidate workspace is scoped to the caller by user_id on every path.
 *
 * There is no policy class here: a saved job or an alert belongs to exactly
 * one user, so there is no shared ownership to arbitrate — only a filter that
 * must never be forgotten. These tests are what stop it being forgotten.
 */

use App\Models\Company;
use App\Models\Job;
use App\Models\JobAlert;
use App\Models\SavedJob;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->seeker = User::factory()->role('job_seeker')->create();
    $this->otherSeeker = User::factory()->role('job_seeker')->create();

    $this->job = Job::factory()->for(Company::factory())->create([
        'status' => Job::STATUS_PUBLISHED,
    ]);
});

// ------------------------------------------------------------- saved jobs

it('lists only the caller\'s own saved jobs', function () {
    SavedJob::factory()->count(2)->create(['user_id' => $this->seeker->id]);
    SavedJob::factory()->count(3)->create(['user_id' => $this->otherSeeker->id]);

    $response = actingAs($this->seeker)->getJson('/api/v1/seeker/saved-jobs')->assertOk();

    expect($response->json('meta.total'))->toBe(2);
});

it('saves a job', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/saved-jobs', ['job_id' => $this->job->id])
        ->assertCreated();

    expect(SavedJob::where('user_id', $this->seeker->id)->where('job_id', $this->job->id)->exists())
        ->toBeTrue();
});

it('saving the same job twice updates the note instead of failing', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/saved-jobs', ['job_id' => $this->job->id, 'note' => 'First'])
        ->assertCreated();

    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/saved-jobs', ['job_id' => $this->job->id, 'note' => 'Second'])
        ->assertCreated();

    $rows = SavedJob::where('user_id', $this->seeker->id)->where('job_id', $this->job->id)->get();

    expect($rows)->toHaveCount(1)
        ->and($rows->first()->note)->toBe('Second');
});

it('does not unsave another user\'s saved job', function () {
    SavedJob::factory()->create([
        'user_id' => $this->otherSeeker->id,
        'job_id' => $this->job->id,
    ]);

    actingAs($this->seeker)
        ->deleteJson("/api/v1/seeker/saved-jobs/{$this->job->id}")
        ->assertOk();

    // The other user's row survives: the delete is filtered by user_id.
    expect(SavedJob::where('user_id', $this->otherSeeker->id)->count())->toBe(1);
});

it('reports which of the given jobs the caller has saved', function () {
    $saved = SavedJob::factory()->create(['user_id' => $this->seeker->id]);
    $theirs = SavedJob::factory()->create(['user_id' => $this->otherSeeker->id]);

    $response = actingAs($this->seeker)
        ->postJson('/api/v1/seeker/saved-jobs/check', [
            'job_ids' => [$saved->job_id, $theirs->job_id],
        ])
        ->assertOk();

    expect($response->json('data'))->toBe([$saved->job_id]);
});

// ----------------------------------------------------------------- alerts

it('lists only the caller\'s own alerts', function () {
    JobAlert::factory()->count(2)->create(['user_id' => $this->seeker->id]);
    JobAlert::factory()->count(3)->create(['user_id' => $this->otherSeeker->id]);

    $response = actingAs($this->seeker)->getJson('/api/v1/seeker/alerts')->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('refuses to touch another user\'s alert', function () {
    $alert = JobAlert::factory()->create([
        'user_id' => $this->otherSeeker->id,
        'name' => 'Theirs',
    ]);

    // 404 rather than 403: confirming the alert exists would leak that
    // another user has one with that id.
    actingAs($this->seeker)
        ->putJson("/api/v1/seeker/alerts/{$alert->id}", ['name' => 'Hijacked', 'frequency' => 'daily'])
        ->assertNotFound();

    actingAs($this->seeker)
        ->deleteJson("/api/v1/seeker/alerts/{$alert->id}")
        ->assertNotFound();

    expect($alert->fresh()->name)->toBe('Theirs');
});

it('caps how many alerts one user can keep', function () {
    JobAlert::factory()->count(10)->create(['user_id' => $this->seeker->id]);

    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/alerts', ['name' => 'One too many', 'frequency' => 'daily'])
        ->assertStatus(422);
});

// ------------------------------------------------------------- dashboard

it('counts only the caller\'s own saved jobs and alerts', function () {
    SavedJob::factory()->count(3)->create(['user_id' => $this->seeker->id]);
    SavedJob::factory()->count(5)->create(['user_id' => $this->otherSeeker->id]);
    JobAlert::factory()->count(2)->create(['user_id' => $this->seeker->id]);

    actingAs($this->seeker)
        ->getJson('/api/v1/seeker/dashboard')
        ->assertOk()
        ->assertJsonPath('data.stats.saved_jobs', 3)
        ->assertJsonPath('data.stats.alerts', 2);
});

it('separates saved jobs that are still open from those that have closed', function () {
    $open = Job::factory()->for(Company::factory())->create(['status' => Job::STATUS_PUBLISHED]);
    $closed = Job::factory()->for(Company::factory())->create(['status' => Job::STATUS_CLOSED]);

    SavedJob::factory()->create(['user_id' => $this->seeker->id, 'job_id' => $open->id]);
    SavedJob::factory()->create(['user_id' => $this->seeker->id, 'job_id' => $closed->id]);

    actingAs($this->seeker)
        ->getJson('/api/v1/seeker/dashboard')
        ->assertOk()
        ->assertJsonPath('data.stats.saved_open', 1)
        ->assertJsonPath('data.stats.saved_closed', 1);
});

it('refuses the candidate workspace to a guest', function () {
    getJson('/api/v1/seeker/saved-jobs')->assertUnauthorized();
    getJson('/api/v1/seeker/dashboard')->assertUnauthorized();
});

// ------------------------------------------------------- public companies

it('shows only active companies in the public directory', function () {
    // beforeEach already created one company for $this->job, so this counts
    // the change rather than assuming an empty table.
    $before = getJson('/api/v1/companies')->json('meta.total');

    Company::factory()->create(['status' => Company::STATUS_ACTIVE]);
    Company::factory()->create(['status' => Company::STATUS_SUSPENDED]);
    Company::factory()->create(['status' => Company::STATUS_PENDING]);

    $response = getJson('/api/v1/companies')->assertOk();

    // Only the active one joins the directory; suspended and pending do not.
    expect($response->json('meta.total'))->toBe($before + 1);
});

it('does not serve a suspended company\'s public page', function () {
    $suspended = Company::factory()->create(['status' => Company::STATUS_SUSPENDED]);

    getJson("/api/v1/companies/{$suspended->slug}")->assertNotFound();
});

it('never publishes a company\'s email or phone', function () {
    $company = Company::factory()->create([
        'status' => Company::STATUS_ACTIVE,
        'email' => 'private@example.com',
        'phone' => '+971500000000',
    ]);

    $response = getJson("/api/v1/companies/{$company->slug}")->assertOk();

    expect($response->json('data'))->not->toHaveKey('email')
        ->and($response->json('data'))->not->toHaveKey('phone');
});

it('lists only a company\'s published jobs', function () {
    $company = Company::factory()->create(['status' => Company::STATUS_ACTIVE]);

    Job::factory()->count(2)->for($company)->create(['status' => Job::STATUS_PUBLISHED]);
    Job::factory()->for($company)->create(['status' => Job::STATUS_DRAFT]);
    Job::factory()->for($company)->create(['status' => Job::STATUS_EXPIRED]);

    $response = getJson("/api/v1/companies/{$company->slug}/jobs")->assertOk();

    expect($response->json('meta.total'))->toBe(2);
});
