<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

/**
 * Who may moderate reader comments.
 *
 * The distinction that matters here is between reading a discussion and
 * running it. Authors hold comments.view so they can follow the conversation
 * under their own articles; the moderation queue is a different thing
 * entirely — it exposes every commenter's email address and IP, and it is
 * gated on comments.approve, which only administrators hold.
 *
 * This is the same trap that leaked company and article data earlier in the
 * project: a `view` permission granted for someone's own workspace is never
 * sufficient authorisation for the platform-wide list.
 */
class CommentPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('administrator') ? true : null;
    }

    /** The moderation queue, and every action taken from it. */
    public function moderate(User $user): bool
    {
        return $user->can('comments.approve');
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $user->can('comments.delete');
    }
}
