<?php

/*
 * The author workspace is scoped to the caller's own articles, by both the
 * query and ArticlePolicy. Two rules matter most:
 *
 *  - an author never publishes directly (articles_require_approval is on), and
 *  - a published article is out of the author's hands, or they could get an
 *    innocuous piece approved and then rewrite it.
 */

use App\Models\Article;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->author = User::factory()->role('author')->create();
    $this->otherAuthor = User::factory()->role('author')->create();
    $this->admin = User::factory()->role('administrator')->create();
});

$body = 'This is a long enough article body to satisfy the hundred character minimum that the API enforces on every submission.';

it('lists only the caller\'s own articles', function () {
    Article::factory()->count(3)->create(['author_id' => $this->author->id]);
    Article::factory()->count(4)->create(['author_id' => $this->otherAuthor->id]);

    $response = actingAs($this->author)->getJson('/api/v1/author/articles')->assertOk();

    expect($response->json('meta.total'))->toBe(3);
});

it('counts only the caller\'s own articles in stats', function () {
    Article::factory()->count(2)->create([
        'author_id' => $this->author->id,
        'status' => Article::STATUS_PUBLISHED,
    ]);
    Article::factory()->count(5)->create(['author_id' => $this->otherAuthor->id]);

    actingAs($this->author)
        ->getJson('/api/v1/author/articles/stats')
        ->assertOk()
        ->assertJsonPath('data.total', 2)
        ->assertJsonPath('data.published', 2);
});

it('refuses to show another author\'s article', function () {
    $other = Article::factory()->create(['author_id' => $this->otherAuthor->id]);

    actingAs($this->author)
        ->getJson("/api/v1/author/articles/{$other->id}")
        ->assertForbidden();
});

it('refuses to edit another author\'s article', function () use ($body) {
    $other = Article::factory()->create([
        'author_id' => $this->otherAuthor->id,
        'status' => Article::STATUS_DRAFT,
    ]);

    actingAs($this->author)
        ->putJson("/api/v1/author/articles/{$other->id}", ['title' => 'Hijacked', 'body' => $body])
        ->assertForbidden();

    expect($other->fresh()->title)->not->toBe('Hijacked');
});

it('does not let an author publish directly', function () use ($body) {
    $response = actingAs($this->author)
        ->postJson('/api/v1/author/articles', [
            'title' => 'Submitted Piece',
            'body' => $body,
            'status' => Article::STATUS_PENDING_REVIEW,
        ])
        ->assertCreated();

    expect($response->json('data.status'))->toBe(Article::STATUS_PENDING_REVIEW)
        ->and($response->json('data.published_at'))->toBeNull();
});

it('rejects a status an author may not ask for', function () use ($body) {
    actingAs($this->author)
        ->postJson('/api/v1/author/articles', [
            'title' => 'Sneaky Publish',
            'body' => $body,
            'status' => Article::STATUS_PUBLISHED,
        ])
        ->assertStatus(422);
});

it('refuses to edit an article once it is published', function () use ($body) {
    $published = Article::factory()->create([
        'author_id' => $this->author->id,
        'status' => Article::STATUS_PUBLISHED,
    ]);

    actingAs($this->author)
        ->putJson("/api/v1/author/articles/{$published->id}", [
            'title' => 'Rewritten After Approval',
            'body' => $body,
        ])
        ->assertForbidden();
});

it('lets an author edit their own draft', function () use ($body) {
    $draft = Article::factory()->create([
        'author_id' => $this->author->id,
        'status' => Article::STATUS_DRAFT,
    ]);

    actingAs($this->author)
        ->putJson("/api/v1/author/articles/{$draft->id}", [
            'title' => 'Revised Draft',
            'body' => $body,
        ])
        ->assertOk();

    expect($draft->fresh()->title)->toBe('Revised Draft');
});

it('clears the rejection note when a piece is resubmitted', function () use ($body) {
    $rejected = Article::factory()->create([
        'author_id' => $this->author->id,
        'status' => Article::STATUS_REJECTED,
        'review_notes' => 'Needs sources.',
    ]);

    actingAs($this->author)
        ->putJson("/api/v1/author/articles/{$rejected->id}", [
            'body' => $body,
            'status' => Article::STATUS_PENDING_REVIEW,
        ])
        ->assertOk();

    $fresh = $rejected->fresh();

    expect($fresh->status)->toBe(Article::STATUS_PENDING_REVIEW)
        ->and($fresh->review_notes)->toBeNull();
});

it('refuses the author workspace to a job seeker', function () {
    $seeker = User::factory()->role('job_seeker')->create();

    actingAs($seeker)->getJson('/api/v1/author/articles')->assertForbidden();
});

it('refuses the author workspace to a guest', function () {
    getJson('/api/v1/author/articles')->assertUnauthorized();
});

it('refuses to delete another author\'s article', function () {
    $other = Article::factory()->create(['author_id' => $this->otherAuthor->id]);

    actingAs($this->author)
        ->deleteJson("/api/v1/author/articles/{$other->id}")
        ->assertForbidden();

    expect(Article::find($other->id))->not->toBeNull();
});
