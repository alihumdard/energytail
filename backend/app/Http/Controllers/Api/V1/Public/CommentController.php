<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Comment;
use App\Models\CommentReport;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Reader comments on an article.
 *
 * Reading is open to guests — the comments are part of the page a crawler
 * indexes. Posting depends on settings the administrator controls: comments
 * can be switched off entirely, restricted to signed-in readers, or held for
 * approval before they appear.
 *
 * Only approved comments are ever returned here. A pending or rejected one is
 * absent rather than forbidden: its existence is not public information, and
 * showing "this comment is awaiting approval" would leak that someone posted.
 */
class CommentController extends Controller
{
    private const REPORT_REASONS = ['spam', 'abuse', 'off_topic', 'other'];

    /**
     * The approved thread for an article.
     *
     * Returned as a tree rather than a flat list: the nesting is what the
     * page renders, and building it here means the client cannot get the
     * parent/child pairing wrong.
     */
    public function index(string $slug): JsonResponse
    {
        $article = $this->publishedArticle($slug);

        $comments = Comment::query()
            ->approved()
            ->where('article_id', $article->getKey())
            ->with('user:id,first_name,last_name,avatar_path')
            ->orderBy('created_at')
            ->get();

        /** @var array<int|string, array<int, Comment>> $byParent */
        $byParent = [];

        foreach ($comments as $comment) {
            $byParent[$comment->parent_id ?? 0][] = $comment;
        }

        return response()->json([
            'data' => array_map(
                fn (Comment $comment) => $this->transform($comment, $byParent),
                // 0 stands in for "no parent": an array key cannot be null.
                $byParent[0] ?? [],
            ),
            'meta' => [
                'total' => $comments->count(),
                'enabled' => $this->postingAllowed($article),
                'guests_allowed' => (bool) Setting::value('guest_comments_enabled', false),
                'moderated' => (bool) Setting::value('comments_require_approval', false),
            ],
        ]);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $article = $this->publishedArticle($slug);

        if (! $this->postingAllowed($article)) {
            return response()->json([
                'message' => 'Comments are closed on this article.',
            ], 403);
        }

        $user = $request->user();
        $guestsAllowed = (bool) Setting::value('guest_comments_enabled', false);

        if ($user === null && ! $guestsAllowed) {
            return response()->json([
                'message' => 'Please sign in to comment.',
            ], 401);
        }

        $rules = [
            'body' => ['required', 'string', 'min:2', 'max:3000'],
            'parent_id' => ['nullable', 'integer'],
        ];

        // A guest has to say who they are; a signed-in reader already has.
        if ($user === null) {
            $rules['guest_name'] = ['required', 'string', 'max:80'];
            $rules['guest_email'] = ['required', 'email', 'max:190'];
        }

        $validated = $request->validate($rules);

        $parent = null;

        if (! empty($validated['parent_id'])) {
            /*
             * The parent must be an approved comment on this same article.
             * Without that check a reply could be attached to a comment on
             * another article, or to one still awaiting moderation.
             */
            $parent = Comment::query()
                ->approved()
                ->where('article_id', $article->getKey())
                ->find($validated['parent_id']);

            if ($parent === null) {
                return response()->json([
                    'message' => 'The comment you are replying to is no longer available.',
                ], 422);
            }

            /*
             * The thread is one level deep: replying to a reply attaches to
             * the top-level comment instead of nesting further, so a long
             * argument stays readable rather than marching off the page.
             */
            if ($parent->parent_id !== null) {
                $parent = $parent->parent;
            }
        }

        /*
         * Held for approval when the setting says so. Guests are always held
         * regardless: an unauthenticated form that publishes straight to a
         * public page is what spam bots look for.
         */
        $moderated = (bool) Setting::value('comments_require_approval', false);
        $status = ($moderated || $user === null)
            ? Comment::STATUS_PENDING
            : Comment::STATUS_APPROVED;

        $comment = DB::transaction(function () use ($article, $parent, $user, $validated, $status, $request) {
            $comment = Comment::query()->create([
                'article_id' => $article->getKey(),
                'parent_id' => $parent?->getKey(),
                'user_id' => $user?->getKey(),
                'guest_name' => $user === null ? $validated['guest_name'] : null,
                'guest_email' => $user === null ? $validated['guest_email'] : null,
                'body' => $validated['body'],
                'status' => $status,
                'ip_address' => $request->ip(),
            ]);

            // The counter tracks what is visible, so it moves only when the
            // comment is actually published.
            if ($status === Comment::STATUS_APPROVED) {
                $article->increment('comments_count');
            }

            return $comment;
        });

        return response()->json([
            'message' => $status === Comment::STATUS_APPROVED
                ? 'Comment posted.'
                : 'Thanks — your comment will appear once it has been reviewed.',
            'data' => $status === Comment::STATUS_APPROVED
                ? $this->transform($comment->load('user:id,first_name,last_name,avatar_path'), [])
                : null,
        ], 201);
    }

    /**
     * Flags a comment for a moderator.
     *
     * Open to guests deliberately: the reader best placed to notice abuse is
     * the one reading the page, and requiring an account to report it would
     * mean most abuse goes unreported.
     */
    public function report(Request $request, int $id): JsonResponse
    {
        $comment = Comment::query()->approved()->findOrFail($id);

        $validated = $request->validate([
            'reason' => ['required', Rule::in(self::REPORT_REASONS)],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        $userId = $request->user()?->getKey();

        /*
         * One report per person per comment. Without this a single reader
         * could inflate reports_count and push a comment to the top of the
         * moderation queue on their own.
         */
        $already = CommentReport::query()
            ->where('comment_id', $comment->getKey())
            ->when(
                $userId !== null,
                fn ($query) => $query->where('user_id', $userId),
                fn ($query) => $query->whereNull('user_id')->where('ip_address', $request->ip()),
            )
            ->exists();

        if ($already) {
            return response()->json(['message' => 'You have already reported this comment.']);
        }

        DB::transaction(function () use ($comment, $validated, $userId, $request) {
            CommentReport::query()->create([
                'comment_id' => $comment->getKey(),
                'user_id' => $userId,
                'reason' => $validated['reason'],
                'details' => $validated['details'] ?? null,
                'ip_address' => $request->ip(),
                'status' => 'open',
            ]);

            $comment->increment('reports_count');
        });

        return response()->json(['message' => 'Thanks — a moderator will take a look.']);
    }

    /**
     * The article, or a 404.
     *
     * Only published articles: a draft's comments are not public, and
     * resolving by slug keeps the URL the same shape as the article page.
     */
    private function publishedArticle(string $slug): Article
    {
        /** @var Article $article */
        $article = Article::query()->published()->where('slug', $slug)->firstOrFail();

        return $article;
    }

    /**
     * Whether this article accepts new comments right now.
     *
     * Both switches have to be on: the global setting, and the per-article
     * flag an author can use to close a contentious piece.
     */
    private function postingAllowed(Article $article): bool
    {
        return (bool) Setting::value('comments_enabled', true) && $article->comments_enabled;
    }

    /**
     * @param  array<int|string, array<int, Comment>>  $byParent
     * @return array<string, mixed>
     */
    private function transform(Comment $comment, array $byParent): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'author' => $comment->authorName(),
            // Registered readers are marked so a guest cannot impersonate one
            // by choosing their name.
            'is_member' => $comment->user_id !== null,
            'avatar_path' => $comment->user?->avatar_path,
            'created_at' => $comment->created_at?->toIso8601String(),
            // Passed an empty map, so a reply never recurses further.
            'replies' => array_map(
                fn (Comment $reply) => $this->transform($reply, []),
                $byParent[$comment->id] ?? [],
            ),
        ];
    }
}
