<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

/**
 * Who may act on an article.
 *
 * Permissions say what a role can do; this says what it can do it to. An
 * author holds articles.edit, but that must never mean editing someone
 * else's piece — authorship is the boundary, as company ownership is for
 * jobs.
 */
class ArticlePolicy
{
    /**
     * Administrators bypass every check below.
     *
     * Returning null rather than false lets the individual methods decide;
     * true here would short-circuit them all.
     */
    public function before(User $user): ?bool
    {
        return $user->hasRole('administrator') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->can('articles.view');
    }

    public function view(User $user, Article $article): bool
    {
        return $user->can('articles.view') && $this->wrote($user, $article);
    }

    public function create(User $user): bool
    {
        return $user->can('articles.add');
    }

    public function update(User $user, Article $article): bool
    {
        /*
         * A published article is out of the author's hands.
         *
         * The plan gates articles on approval, and editing after publication
         * would let an author get an innocuous piece approved and then
         * rewrite it. Changes go back through a moderator.
         */
        if ($article->status === Article::STATUS_PUBLISHED) {
            return false;
        }

        return $user->can('articles.edit') && $this->wrote($user, $article);
    }

    public function delete(User $user, Article $article): bool
    {
        return $user->can('articles.delete') && $this->wrote($user, $article);
    }

    /**
     * Approving is a moderator's act, never the author's.
     *
     * Authorship is deliberately not consulted: letting an author approve
     * their own article would make the review gate decorative.
     */
    public function approve(User $user): bool
    {
        return $user->can('articles.approve');
    }

    /** Whether this user wrote the article. */
    private function wrote(User $user, Article $article): bool
    {
        return $article->author_id === $user->getKey();
    }
}
