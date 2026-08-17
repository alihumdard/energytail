<?php

namespace Database\Factories;

use App\Models\City;
use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Job;
use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Job>
 */
class JobFactory extends Factory
{
    protected $model = Job::class;

    /** Real energy-sector titles, so demo listings read like the product. */
    private const TITLES = [
        'Senior Drilling Engineer', 'HSE Advisor', 'Process Safety Engineer',
        'Instrumentation Technician', 'Reservoir Engineer', 'Mechanical Engineer',
        'Electrical Engineer', 'Field Operator', 'Civil Engineer', 'Geoscientist',
        'Production Supervisor', 'Pipeline Integrity Engineer', 'LNG Process Operator',
        'Subsea Engineer', 'Wind Turbine Technician', 'Solar Project Manager',
        'Rotating Equipment Specialist', 'Completion Engineer', 'Mud Logger',
        'Offshore Installation Manager',
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->randomElement(self::TITLES);
        $country = Country::inRandomOrder()->first();
        $city = $country
            ? City::where('country_id', $country->id)->inRandomOrder()->first()
            : null;

        $salaryMin = fake()->numberBetween(40, 140) * 1000;
        $experienceMin = fake()->numberBetween(0, 8);

        // Roughly a third of listings route applications to email, matching a
        // realistic split for the apply-redirect system.
        $byEmail = fake()->boolean(35);

        return [
            // Sequence-based rather than a random unique(), which exhausts its
            // pool once the demo set grows past a few thousand rows.
            'reference' => 'ET-'.fake()->unique()->numerify('######'),
            'company_id' => Company::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'job_category_id' => JobCategory::inRandomOrder()->value('id'),
            'industry_id' => Industry::inRandomOrder()->value('id'),
            'country_id' => $country?->id,
            'city_id' => $city?->id,
            // $city is only ever set when $country is, so testing $city alone
            // is sufficient here.
            'location_label' => $city ? "{$city->name}, {$country->name}" : null,
            'employment_type' => fake()->randomElement(['full_time', 'contract', 'part_time']),
            'is_remote' => fake()->boolean(20),
            'description' => fake()->paragraphs(3, true),
            'responsibilities' => fake()->paragraphs(2, true),
            'requirements' => fake()->paragraphs(2, true),
            'benefits' => fake()->paragraph(),
            'experience_min' => $experienceMin,
            'experience_max' => $experienceMin + fake()->numberBetween(2, 5),
            'salary_min' => $salaryMin,
            'salary_max' => $salaryMin + fake()->numberBetween(10, 40) * 1000,
            'salary_currency' => 'USD',
            'salary_period' => 'yearly',
            'apply_method' => $byEmail ? Job::APPLY_EMAIL : Job::APPLY_EXTERNAL_URL,
            'apply_email' => $byEmail ? fake()->companyEmail() : null,
            'apply_url' => $byEmail ? null : 'https://'.fake()->domainName().'/careers/apply',
            'status' => Job::STATUS_PUBLISHED,
            'published_at' => fake()->dateTimeBetween('-60 days', 'now'),
            'deadline_at' => fake()->dateTimeBetween('+5 days', '+60 days'),
            'views_count' => fake()->numberBetween(50, 2000),
            'apply_clicks_count' => fake()->numberBetween(5, 150),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => Job::STATUS_DRAFT,
            'published_at' => null,
            'views_count' => 0,
            'apply_clicks_count' => 0,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => Job::STATUS_EXPIRED,
            'published_at' => fake()->dateTimeBetween('-120 days', '-70 days'),
            'deadline_at' => fake()->dateTimeBetween('-30 days', '-1 day'),
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn () => ['is_featured' => true]);
    }
}
