<?php

use App\Models\SeekerExperience;
use App\Models\SeekerLanguage;
use App\Models\Skill;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);

    $this->seeker = User::factory()->create(['email_verified_at' => now()]);
    $this->seeker->assignRole('job_seeker');

    $this->other = User::factory()->create(['email_verified_at' => now()]);
    $this->other->assignRole('job_seeker');
});

// ------------------------------------------------------------------- profile

it('creates the profile row on first read', function () {
    actingAs($this->seeker)
        ->getJson('/api/v1/seeker/seeker-profile')
        ->assertOk()
        ->assertJsonPath('data.completeness', 0);

    $this->assertDatabaseHas('seeker_profiles', ['user_id' => $this->seeker->id]);
});

it('saves the profile and scores completeness', function () {
    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/seeker-profile', [
            'headline' => 'Subsea Engineer',
            'summary' => 'Twelve years offshore.',
            'experience_years' => 12,
        ])
        ->assertOk()
        ->assertJsonPath('data.headline', 'Subsea Engineer')
        // headline 15 + summary 15 + experience_years 10.
        ->assertJsonPath('data.completeness', 40);
});

/*
 * The weights are a list of pairs rather than a map keyed by the condition.
 * A map would collapse every check into the two keys PHP casts booleans to,
 * scoring an empty profile the same as a full one — so a filled profile
 * scoring higher than a sparse one is the assertion that matters.
 */
it('scores a fuller profile higher', function () {
    actingAs($this->seeker)->putJson('/api/v1/seeker/seeker-profile', ['headline' => 'Engineer']);
    $sparse = getJson('/api/v1/seeker/seeker-profile')->json('data.completeness');

    actingAs($this->seeker)->putJson('/api/v1/seeker/seeker-profile', [
        'summary' => 'Detail.',
        'experience_years' => 8,
        'availability' => 'immediate',
    ]);
    $fuller = getJson('/api/v1/seeker/seeker-profile')->json('data.completeness');

    expect($fuller)->toBeGreaterThan($sparse);
});

it('rejects an expected salary range that reads backwards', function () {
    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/seeker-profile', [
            'expected_salary_min' => 9000,
            'expected_salary_max' => 100,
        ])
        ->assertStatus(422);
});

// ---------------------------------------------------------------- experience

it('adds a work experience', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/experiences', [
            'job_title' => 'Subsea Engineer',
            'company_name' => 'PetroEnergy',
            'started_on' => '2019-03-01',
        ])
        ->assertCreated()
        ->assertJsonPath('data.job_title', 'Subsea Engineer');
});

it('clears the end date when the role is current', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/experiences', [
            'job_title' => 'Engineer',
            'company_name' => 'Acme',
            'started_on' => '2019-03-01',
            'ended_on' => '2020-01-01',
            'is_current' => true,
        ])
        ->assertCreated()
        // "I still work here" and an end date contradict each other; the
        // checkbox is what the candidate clicked, so the date goes.
        ->assertJsonPath('data.ended_on', null);
});

it('refuses an end date before the start date', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/experiences', [
            'job_title' => 'Engineer',
            'company_name' => 'Acme',
            'started_on' => '2020-01-01',
            'ended_on' => '2019-01-01',
        ])
        ->assertStatus(422);
});

// ----------------------------------------------------------------- ownership

/*
 * The row id travels in the URL, so without the per-user scope any signed-in
 * account could edit or delete another candidate's history. 404 rather than
 * 403: whether the id exists is not a stranger's business.
 */
it('hides another candidate\'s rows from the list', function () {
    SeekerExperience::query()->create([
        'user_id' => $this->other->id,
        'job_title' => 'Theirs',
        'company_name' => 'Acme',
        'is_current' => false,
        'sort_order' => 0,
    ]);

    actingAs($this->seeker)
        ->getJson('/api/v1/seeker/experiences')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('refuses to update a row belonging to someone else', function () {
    $theirs = SeekerExperience::query()->create([
        'user_id' => $this->other->id,
        'job_title' => 'Theirs',
        'company_name' => 'Acme',
        'is_current' => false,
        'sort_order' => 0,
    ]);

    actingAs($this->seeker)
        ->putJson("/api/v1/seeker/experiences/{$theirs->id}", ['job_title' => 'Hijacked'])
        ->assertNotFound();

    expect($theirs->fresh()->job_title)->toBe('Theirs');
});

it('refuses to delete a row belonging to someone else', function () {
    $theirs = SeekerExperience::query()->create([
        'user_id' => $this->other->id,
        'job_title' => 'Theirs',
        'company_name' => 'Acme',
        'is_current' => false,
        'sort_order' => 0,
    ]);

    actingAs($this->seeker)
        ->deleteJson("/api/v1/seeker/experiences/{$theirs->id}")
        ->assertNotFound();

    $this->assertDatabaseHas('seeker_experiences', ['id' => $theirs->id]);
});

it('leaves another candidate\'s rows alone when reordering', function () {
    $theirs = SeekerExperience::query()->create([
        'user_id' => $this->other->id,
        'job_title' => 'Theirs',
        'company_name' => 'Acme',
        'is_current' => false,
        'sort_order' => 7,
    ]);

    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/experiences/reorder', ['ids' => [$theirs->id]])
        ->assertOk();

    expect($theirs->fresh()->sort_order)->toBe(7);
});

// ------------------------------------------------------------------ sections

it('stores an education row', function () {
    // The table is seeker_educations; Laravel's inflector would derive
    // "seeker_education" on its own, which is why the model pins the name.
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/educations', ['institution' => 'NED University'])
        ->assertCreated();

    $this->assertDatabaseHas('seeker_educations', ['institution' => 'NED University']);
});

it('refuses a certificate that expires before it was issued', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/certificates', [
            'name' => 'BOSIET',
            'issued_on' => '2024-01-10',
            'expires_on' => '2020-01-01',
        ])
        ->assertStatus(422);
});

it('reports whether a certificate has expired', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/certificates', [
            'name' => 'Lapsed ticket',
            'issued_on' => '2018-01-01',
            'expires_on' => '2019-01-01',
        ])
        ->assertCreated()
        ->assertJsonPath('data.is_expired', true);
});

it('rejects the same language twice', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/languages', ['language' => 'English'])
        ->assertCreated();

    // The table enforces this; without the rule it surfaces as a 500 that
    // tells the candidate nothing.
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/languages', ['language' => 'English'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('language');
});

it('lets a language keep its own name when edited', function () {
    $row = SeekerLanguage::query()->create([
        'user_id' => $this->seeker->id,
        'language' => 'English',
        'sort_order' => 0,
    ]);

    // The uniqueness rule must ignore the row being updated, or changing only
    // the proficiency would collide with itself.
    actingAs($this->seeker)
        ->putJson("/api/v1/seeker/languages/{$row->id}", [
            'language' => 'English',
            'proficiency' => 'native',
        ])
        ->assertOk()
        ->assertJsonPath('data.proficiency', 'native');
});

it('rejects a proficiency outside the list', function () {
    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/languages', ['language' => 'Urdu', 'proficiency' => 'wizard'])
        ->assertStatus(422);
});

// --------------------------------------------------------------------- skills

it('replaces the whole skill set on sync', function () {
    $skills = Skill::query()->limit(2)->pluck('id');

    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/skills', [
            'skills' => [
                ['skill_id' => $skills[0], 'proficiency' => 'expert', 'years_experience' => 10],
                ['skill_id' => $skills[1]],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(2, 'data');

    // Syncing a shorter set removes what is no longer there.
    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/skills', ['skills' => [['skill_id' => $skills[0]]]])
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('collapses a skill sent twice into one row', function () {
    $skill = Skill::query()->value('id');

    // The pivot has a unique (user_id, skill_id); sending a duplicate must not
    // reach the database as two inserts.
    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/skills', [
            'skills' => [
                ['skill_id' => $skill, 'proficiency' => 'beginner'],
                ['skill_id' => $skill, 'proficiency' => 'expert'],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

// -------------------------------------------------------------------- access

it('is closed to guests', function () {
    getJson('/api/v1/seeker/experiences')->assertUnauthorized();
    postJson('/api/v1/seeker/languages', ['language' => 'English'])->assertUnauthorized();
    putJson('/api/v1/seeker/seeker-profile', ['headline' => 'x'])->assertUnauthorized();
    deleteJson('/api/v1/seeker/experiences/1')->assertUnauthorized();
});
