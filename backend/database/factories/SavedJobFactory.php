<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Company;
use App\Models\Job;
use App\Models\SavedJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SavedJob> */
class SavedJobFactory extends Factory
{
    protected $model = SavedJob::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_id' => Job::factory()->for(Company::factory()),
            'note' => null,
        ];
    }
}
