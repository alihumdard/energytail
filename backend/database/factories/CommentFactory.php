<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Article;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Comment> */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'article_id' => Article::factory(),
            'parent_id' => null,
            'user_id' => User::factory(),
            'guest_name' => null,
            'guest_email' => null,
            'body' => $this->faker->paragraph(),
            'status' => Comment::STATUS_APPROVED,
            'ip_address' => $this->faker->ipv4(),
            'reports_count' => 0,
        ];
    }

    /** A comment left by someone who was not signed in. */
    public function guest(): static
    {
        return $this->state(fn (): array => [
            'user_id' => null,
            'guest_name' => $this->faker->name(),
            'guest_email' => $this->faker->safeEmail(),
            // Guests are always queued, whatever the moderation setting says.
            'status' => Comment::STATUS_PENDING,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (): array => ['status' => Comment::STATUS_PENDING]);
    }
}
