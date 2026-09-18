<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Resume;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Resume> */
class ResumeFactory extends Factory
{
    protected $model = Resume::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->words(2, true).'.pdf';

        return [
            'user_id' => User::factory(),
            'title' => $this->faker->words(2, true),
            'disk' => 'local',
            'path' => 'resumes/test/'.$this->faker->uuid().'.pdf',
            'original_name' => $name,
            'mime_type' => 'application/pdf',
            'size_bytes' => $this->faker->numberBetween(50_000, 500_000),
            'is_default' => false,
        ];
    }
}
