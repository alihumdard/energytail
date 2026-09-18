<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Comment;
use App\Services\Admin\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Comment moderation.
 *
 * Gated on comments.approve throughout, never comments.view: authors hold
 * `view` so they can read the discussion under their own pieces, and using it
 * here would hand every author the whole moderation queue — every reader's
 * email address and IP included.
 */
class AdminCommentController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('moderate', Comment::class);

        $query = Comment::query()
            ->with([
                'user:id,first_name,last_name,email',
                'article:id,title,slug',
            ]);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        // Reported comments first when asked for: they are the ones a
        // moderator is looking for.
        if ($request->boolean('reported')) {
            $query->where('reports_count', '>', 0)->orderByDesc('reports_count');
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(function (Builder $q) use ($like) {
                $q->where('body', 'ilike', $like)
                    ->orWhere('guest_name', 'ilike', $like)
                    ->orWhere('guest_email', 'ilike', $like);
            });
        }

        // Oldest pending first: a comment held for review is someone waiting.
        $query->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->orderByDesc('created_at');

        $perPage = min(100, max(1, $request->integer('per_page', 20)));
        $comments = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => collect($comments->items())
                ->map(fn (Comment $comment) => $this->transform($comment))
                ->all(),
            'meta' => [
                'current_page' => $comments->currentPage(),
                'last_page' => $comments->lastPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        $this->authorize('moderate', Comment::class);

        $byStatus = Comment::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'data' => [
                'total' => (int) $byStatus->sum(),
                'pending' => (int) ($byStatus[Comment::STATUS_PENDING] ?? 0),
                'approved' => (int) ($byStatus[Comment::STATUS_APPROVED] ?? 0),
                'spam' => (int) ($byStatus[Comment::STATUS_SPAM] ?? 0),
                'rejected' => (int) ($byStatus[Comment::STATUS_REJECTED] ?? 0),
                'reported' => Comment::query()->where('reports_count', '>', 0)->count(),
            ],
        ]);
    }

    /**
     * Moves a comment between states.
     *
     * One endpoint rather than approve/reject/spam separately: they differ
     * only in the target status, and the counter bookkeeping below has to be
     * identical for all of them or the article's total drifts.
     */
    public function setStatus(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('moderate', Comment::class);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                Comment::STATUS_APPROVED,
                Comment::STATUS_PENDING,
                Comment::STATUS_SPAM,
                Comment::STATUS_REJECTED,
            ])],
        ]);

        $was = $comment->status;
        $now = $validated['status'];

        if ($was !== $now) {
            DB::transaction(function () use ($comment, $was, $now, $request) {
                $comment->update([
                    'status' => $now,
                    'moderated_by' => $request->user()?->getKey(),
                    'moderated_at' => now(),
                ]);

                /*
                 * comments_count tracks what readers can see. Crossing into
                 * or out of "approved" is the only thing that moves it, so a
                 * pending comment going to spam changes nothing.
                 */
                $this->adjustCount($comment->article_id, $was, $now);
            });
        }

        $this->audit->log('comments', $now, "Comment #{$comment->getKey()} marked {$now}", $comment);

        return response()->json([
            'message' => 'Comment updated.',
            'data' => $this->transform($comment->fresh(['user', 'article'])),
        ]);
    }

    /** Removes a comment. Soft-deleted, so a mistake can be undone in the database. */
    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('moderate', Comment::class);

        DB::transaction(function () use ($comment) {
            if ($comment->status === Comment::STATUS_APPROVED) {
                $this->adjustCount($comment->article_id, Comment::STATUS_APPROVED, Comment::STATUS_REJECTED);
            }

            // Replies would otherwise hang off a parent that no longer shows,
            // which reads as a conversation with half of it missing.
            Comment::query()->where('parent_id', $comment->getKey())->delete();

            $comment->delete();
        });

        $this->audit->log('comments', 'deleted', "Deleted comment #{$comment->getKey()}", $comment);

        return response()->json(['message' => 'Comment removed.']);
    }

    /** Keeps the article's visible-comment counter in step with a status change. */
    private function adjustCount(int $articleId, string $was, string $now): void
    {
        $wasVisible = $was === Comment::STATUS_APPROVED;
        $isVisible = $now === Comment::STATUS_APPROVED;

        if ($wasVisible === $isVisible) {
            return;
        }

        if ($isVisible) {
            Article::query()->whereKey($articleId)->increment('comments_count');

            return;
        }

        /*
         * Clamped in SQL rather than read-then-write: the stored count can
         * already be wrong, and correcting it afterwards from a stale
         * in-memory model just writes the old value back.
         */
        Article::query()
            ->whereKey($articleId)
            ->update([
                'comments_count' => DB::raw('greatest(comments_count - 1, 0)'),
            ]);
    }

    /** @return array<string, mixed> */
    private function transform(Comment $comment): array
    {
        /** @var Article|null $article */
        $article = $comment->relationLoaded('article') ? $comment->article : null;

        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'status' => $comment->status,
            'author' => $comment->authorName(),
            'is_member' => $comment->user_id !== null,
            /*
             * The email and IP are here because moderating spam needs them —
             * this endpoint is why the gate is comments.approve rather than
             * comments.view.
             */
            'email' => $comment->user !== null ? $comment->user->email : $comment->guest_email,
            'ip_address' => $comment->ip_address,
            'reports_count' => $comment->reports_count,
            'is_reply' => $comment->parent_id !== null,
            'article' => $article !== null ? [
                'id' => $article->id,
                'title' => $article->title,
                'slug' => $article->slug,
            ] : null,
            'created_at' => $comment->created_at?->toIso8601String(),
            'moderated_at' => $comment->moderated_at?->toIso8601String(),
        ];
    }
}
