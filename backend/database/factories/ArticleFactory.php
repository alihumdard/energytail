<?php

namespace Database\Factories;

use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    protected $model = Article::class;

    private const TITLES = [
        'Future of Offshore Wind Energy in 2026',
        'Global Oil Market Outlook',
        'LNG Demand to Surge in Asia',
        'Top HSE Practices in Oil & Gas',
        'Solar Energy Investments Guide',
        'Carbon Capture Technologies Explained',
        'Power Generation Trends',
        'Pipeline Safety Management Essentials',
        'How to Build an Energy Sector CV',
        'Salary Benchmarks for Drilling Engineers',
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Titles may repeat across demo articles; uniqueness lives on the
        // slug, which carries a random suffix.
        $title = fake()->randomElement(self::TITLES);
        $body = fake()->paragraphs(8, true);

        return [
            'author_id' => User::factory(),
            'article_category_id' => ArticleCategory::inRandomOrder()->value('id'),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(4)),
            'excerpt' => fake()->paragraph(),
            'body' => $body,
            'status' => Article::STATUS_PUBLISHED,
            'published_at' => fake()->dateTimeBetween('-90 days', 'now'),
            // Roughly 200 words per minute, the figure the reading-time label uses.
            'reading_minutes' => max(1, (int) ceil(str_word_count($body) / 200)),
            'views_count' => fake()->numberBetween(100, 3000),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => Article::STATUS_DRAFT,
            'published_at' => null,
            'views_count' => 0,
        ]);
    }

    public function pendingReview(): static
    {
        return $this->state(fn () => [
            'status' => Article::STATUS_PENDING_REVIEW,
            'published_at' => null,
        ]);
    }
}
