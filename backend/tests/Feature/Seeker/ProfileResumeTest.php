<?php

/*
 * A candidate's profile and CVs.
 *
 * Two rules carry real consequences:
 *
 *  - email cannot be changed here, because the verification flow is what
 *    makes an address trustworthy, and
 *  - a CV lives on the private disk. It carries a home address and phone
 *    number, so a guessable public URL would expose every candidate's.
 */

use App\Models\Resume;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->seeker = User::factory()->role('job_seeker')->create();
    $this->otherSeeker = User::factory()->role('job_seeker')->create();
});

it('updates the caller\'s own profile', function () {
    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/profile', ['first_name' => 'Renamed', 'phone' => '+971500000000'])
        ->assertOk();

    $fresh = $this->seeker->fresh();

    expect($fresh->first_name)->toBe('Renamed')
        ->and($fresh->phone)->toBe('+971500000000');
});

it('does not let a candidate change their email here', function () {
    $original = $this->seeker->email;

    actingAs($this->seeker)
        ->putJson('/api/v1/seeker/profile', ['email' => 'hijack@example.com'])
        ->assertOk();

    // Changing it would move the account to an address nobody has proved
    // they control.
    expect($this->seeker->fresh()->email)->toBe($original);
});

it('uploads a CV to the private disk', function () {
    Storage::fake('local');

    $response = actingAs($this->seeker)
        ->postJson('/api/v1/seeker/resumes', [
            'file' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        ])
        ->assertCreated();

    $resume = Resume::first();

    expect($resume->user_id)->toBe($this->seeker->id)
        ->and($resume->disk)->toBe('local')
        // The first CV becomes the default, so a candidate who uploads one
        // and stops still has a usable profile.
        ->and($resume->is_default)->toBeTrue();

    Storage::disk('local')->assertExists($resume->path);

    // The storage path never leaves the server.
    expect($response->json('data'))->not->toHaveKey('path');
});

it('refuses a file that is not a CV', function () {
    Storage::fake('local');

    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/resumes', [
            'file' => UploadedFile::fake()->create('payload.exe', 10, 'application/x-msdownload'),
        ])
        ->assertStatus(422);

    expect(Resume::count())->toBe(0);
});

it('refuses a CV over the size limit', function () {
    Storage::fake('local');

    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/resumes', [
            'file' => UploadedFile::fake()->create('huge.pdf', 6000, 'application/pdf'),
        ])
        ->assertStatus(422);
});

it('lists only the caller\'s own CVs', function () {
    Resume::factory()->count(2)->create(['user_id' => $this->seeker->id]);
    Resume::factory()->count(3)->create(['user_id' => $this->otherSeeker->id]);

    $response = actingAs($this->seeker)->getJson('/api/v1/seeker/resumes')->assertOk();

    expect($response->json('data'))->toHaveCount(2);
});

it('does not serve another candidate\'s CV', function () {
    $theirs = Resume::factory()->create(['user_id' => $this->otherSeeker->id]);

    // 404 rather than 403: confirming it exists would leak that another
    // candidate has a CV with that id.
    actingAs($this->seeker)
        ->getJson("/api/v1/seeker/resumes/{$theirs->id}/download")
        ->assertNotFound();

    actingAs($this->seeker)
        ->deleteJson("/api/v1/seeker/resumes/{$theirs->id}")
        ->assertNotFound();

    expect(Resume::find($theirs->id))->not->toBeNull();
});

it('promotes another CV when the default is deleted', function () {
    Storage::fake('local');

    $default = Resume::factory()->create(['user_id' => $this->seeker->id, 'is_default' => true]);
    $other = Resume::factory()->create(['user_id' => $this->seeker->id, 'is_default' => false]);

    actingAs($this->seeker)
        ->deleteJson("/api/v1/seeker/resumes/{$default->id}")
        ->assertOk();

    // Otherwise the candidate is left with a CV and none marked to send.
    expect($other->fresh()->is_default)->toBeTrue();
});

it('keeps only one CV marked as default', function () {
    $first = Resume::factory()->create(['user_id' => $this->seeker->id, 'is_default' => true]);
    $second = Resume::factory()->create(['user_id' => $this->seeker->id, 'is_default' => false]);

    actingAs($this->seeker)
        ->patchJson("/api/v1/seeker/resumes/{$second->id}/default")
        ->assertOk();

    expect($first->fresh()->is_default)->toBeFalse()
        ->and($second->fresh()->is_default)->toBeTrue();
});

it('caps how many CVs one account can keep', function () {
    Storage::fake('local');

    Resume::factory()->count(5)->create(['user_id' => $this->seeker->id]);

    actingAs($this->seeker)
        ->postJson('/api/v1/seeker/resumes', [
            'file' => UploadedFile::fake()->create('sixth.pdf', 100, 'application/pdf'),
        ])
        ->assertStatus(422);
});

it('refuses the profile endpoints to a guest', function () {
    getJson('/api/v1/seeker/profile')->assertUnauthorized();
    getJson('/api/v1/seeker/resumes')->assertUnauthorized();
});
