<?php

use App\Models\Article;
use App\Models\Comment;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);

    $this->article = Article::factory()->create([
        'slug' => 'live-article',
        'status' => Article::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
        'comments_enabled' => true,
        'comments_count' => 0,
    ]);

    $this->reader = User::factory()->create(['email_verified_at' => now()]);
    $this->reader->assignRole('job_seeker');

    $this->admin = User::factory()->create(['email_verified_at' => now()]);
    $this->admin->assignRole('administrator');

    setting('comments_enabled', true);
    setting('guest_comments_enabled', false);
    setting('comments_require_approval', false);
});

/** Writes a settings row the controller reads through Setting::value(). */
function setting(string $key, bool $value): void
{
    Setting::query()->updateOrCreate(
        ['key' => $key],
        ['group' => 'comments', 'value' => $value ? '1' : '0', 'type' => 'boolean'],
    );
}

// --------------------------------------------------------------------- read

it('lets a guest read the thread', function () {
    Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    getJson('/api/v1/articles/live-article/comments')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

/*
 * A pending comment is absent rather than forbidden: saying "awaiting
 * approval" would leak that someone posted, and a rejected one is nobody's
 * business at all.
 */
it('hides comments that are not approved', function () {
    foreach ([Comment::STATUS_PENDING, Comment::STATUS_SPAM, Comment::STATUS_REJECTED] as $status) {
        Comment::factory()->create([
            'article_id' => $this->article->id,
            'status' => $status,
        ]);
    }

    getJson('/api/v1/articles/live-article/comments')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('does not expose comments on an unpublished article', function () {
    $draft = Article::factory()->create([
        'slug' => 'draft-article',
        'status' => Article::STATUS_DRAFT,
        'published_at' => null,
    ]);

    Comment::factory()->create([
        'article_id' => $draft->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    getJson('/api/v1/articles/draft-article/comments')->assertNotFound();
});

// -------------------------------------------------------------------- post

it('lets a signed-in reader post', function () {
    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', ['body' => 'Useful piece.'])
        ->assertCreated();

    // The counter tracks what readers can see, so an approved comment moves it.
    expect($this->article->fresh()->comments_count)->toBe(1);
});

it('turns a guest away when guest comments are off', function () {
    postJson('/api/v1/articles/live-article/comments', ['body' => 'Hello.'])
        ->assertUnauthorized();
});

it('holds a guest comment for approval even when moderation is off', function () {
    setting('guest_comments_enabled', true);

    postJson('/api/v1/articles/live-article/comments', [
        'body' => 'Hello from a stranger.',
        'guest_name' => 'Stranger',
        'guest_email' => 'stranger@example.com',
    ])->assertCreated();

    /*
     * An unauthenticated form that publishes straight to a public page is
     * what spam bots look for, so a guest is always queued regardless of the
     * moderation setting.
     */
    $this->assertDatabaseHas('comments', [
        'guest_email' => 'stranger@example.com',
        'status' => Comment::STATUS_PENDING,
    ]);

    expect($this->article->fresh()->comments_count)->toBe(0);
});

it('holds every comment when moderation is on', function () {
    setting('comments_require_approval', true);

    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', ['body' => 'Held for review.'])
        ->assertCreated()
        ->assertJsonPath('data', null);

    expect($this->article->fresh()->comments_count)->toBe(0);
});

it('refuses when comments are closed on the article', function () {
    $this->article->update(['comments_enabled' => false]);

    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', ['body' => 'Anyone there?'])
        ->assertForbidden();
});

it('refuses when comments are switched off site-wide', function () {
    setting('comments_enabled', false);

    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', ['body' => 'Anyone there?'])
        ->assertForbidden();
});

// ------------------------------------------------------------------ replies

it('keeps the thread one level deep', function () {
    $parent = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    $reply = Comment::factory()->create([
        'article_id' => $this->article->id,
        'parent_id' => $parent->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    // Replying to a reply attaches to the top-level comment instead of
    // nesting further, so a long argument stays readable.
    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', [
            'body' => 'Third level attempt.',
            'parent_id' => $reply->id,
        ])
        ->assertCreated();

    $this->assertDatabaseHas('comments', [
        'body' => 'Third level attempt.',
        'parent_id' => $parent->id,
    ]);
});

it('refuses a reply to a comment on another article', function () {
    $other = Article::factory()->create([
        'slug' => 'other-article',
        'status' => Article::STATUS_PUBLISHED,
        'published_at' => now()->subDay(),
    ]);

    $elsewhere = Comment::factory()->create([
        'article_id' => $other->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    actingAs($this->reader)
        ->postJson('/api/v1/articles/live-article/comments', [
            'body' => 'Orphan reply.',
            'parent_id' => $elsewhere->id,
        ])
        ->assertStatus(422);
});

// ---------------------------------------------------------------- reporting

it('counts a report once per person', function () {
    $comment = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
        'reports_count' => 0,
    ]);

    actingAs($this->reader)
        ->postJson("/api/v1/comments/{$comment->id}/report", ['reason' => 'spam'])
        ->assertOk();

    // A second report from the same reader must not inflate the count, or one
    // person could push any comment to the top of the moderation queue.
    actingAs($this->reader)
        ->postJson("/api/v1/comments/{$comment->id}/report", ['reason' => 'spam'])
        ->assertOk();

    expect($comment->fresh()->reports_count)->toBe(1);
});

// --------------------------------------------------------------- moderation

/*
 * The gate is comments.approve, never comments.view. Authors hold `view` so
 * they can follow the discussion under their own pieces; the queue carries
 * every commenter's email address and IP.
 */
it('keeps the moderation queue away from every non-admin role', function (string $role) {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role);

    actingAs($user)->getJson('/api/v1/admin/comments')->assertForbidden();
})->with(['author', 'employer', 'job_seeker']);

it('lets an administrator moderate', function () {
    $comment = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    $this->article->update(['comments_count' => 1]);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/comments/{$comment->id}/status", ['status' => 'spam'])
        ->assertOk();

    expect($comment->fresh()->status)->toBe(Comment::STATUS_SPAM)
        // Leaving "approved" takes the comment off the public count.
        ->and($this->article->fresh()->comments_count)->toBe(0);
});

it('puts an approved comment back on the count', function () {
    $comment = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_PENDING,
    ]);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/comments/{$comment->id}/status", ['status' => 'approved'])
        ->assertOk();

    expect($this->article->fresh()->comments_count)->toBe(1);
});

it('never drives the count below zero', function () {
    $comment = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    // The stored count is already wrong; moderating must not make it negative.
    $this->article->update(['comments_count' => 0]);

    actingAs($this->admin)
        ->patchJson("/api/v1/admin/comments/{$comment->id}/status", ['status' => 'rejected'])
        ->assertOk();

    expect($this->article->fresh()->comments_count)->toBe(0);
});

it('removes replies along with the comment they hang off', function () {
    $parent = Comment::factory()->create([
        'article_id' => $this->article->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    $reply = Comment::factory()->create([
        'article_id' => $this->article->id,
        'parent_id' => $parent->id,
        'status' => Comment::STATUS_APPROVED,
    ]);

    actingAs($this->admin)
        ->deleteJson("/api/v1/admin/comments/{$parent->id}")
        ->assertOk();

    // A reply left behind would read as half a conversation.
    $this->assertSoftDeleted('comments', ['id' => $reply->id]);
});
