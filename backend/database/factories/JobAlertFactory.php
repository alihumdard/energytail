<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\JobAlert;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<JobAlert> */
class JobAlertFactory extends Factory
{
    protected $model = JobAlert::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->words(3, true),
            'keywords' => $this->faker->word(),
            'frequency' => $this->faker->randomElement(['daily', 'weekly', 'monthly']),
            'is_active' => true,
            'is_remote' => false,
        ];
    }
}
