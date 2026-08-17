<?php

namespace Database\Factories;

use App\Models\City;
use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company();
        $country = Country::inRandomOrder()->first();
        $city = $country
            ? City::where('country_id', $country->id)->inRandomOrder()->first()
            : null;

        return [
            'owner_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'email' => fake()->companyEmail(),
            'website' => 'https://'.Str::slug($name).'.com',
            'industry_id' => Industry::inRandomOrder()->value('id'),
            'country_id' => $country?->id,
            'city_id' => $city?->id,
            'description' => fake()->paragraphs(3, true),
            'company_size' => fake()->randomElement([
                '1 - 50 employees', '51 - 200 employees',
                '201 - 500 employees', '501 - 1000 employees', '1000+ employees',
            ]),
            'founded_year' => fake()->numberBetween(1950, 2020),
            'status' => Company::STATUS_ACTIVE,
            'is_verified' => fake()->boolean(70),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => Company::STATUS_PENDING,
            'is_verified' => false,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn () => [
            'is_featured' => true,
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }
}
