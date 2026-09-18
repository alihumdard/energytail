<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Plan> */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'price_cents' => $this->faker->numberBetween(0, 50000),
            'currency' => 'USD',
            'interval' => 'month',
            'job_limit' => $this->faker->numberBetween(1, 50),
            'featured_job_limit' => 0,
            'job_duration_days' => 30,
            'is_active' => true,
        ];
    }
}
