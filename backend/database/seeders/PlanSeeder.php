<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * The plans an employer can buy.
 *
 * Prices are in cents. The Stripe product and price ids are left null: they
 * are created in the Stripe dashboard and pasted onto the plan afterwards, so
 * the tiers can be reviewed and priced before the account exists.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'For a company hiring occasionally.',
                'price_cents' => 0,
                'interval' => 'month',
                'job_limit' => 1,
                'featured_job_limit' => 0,
                'job_duration_days' => 30,
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'For a growing team hiring through the year.',
                'price_cents' => 9900,
                'interval' => 'month',
                'job_limit' => 10,
                'featured_job_limit' => 2,
                'job_duration_days' => 30,
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'For operators recruiting across several sites.',
                'price_cents' => 24900,
                'interval' => 'month',
                'job_limit' => 40,
                'featured_job_limit' => 8,
                'job_duration_days' => 45,
                'is_popular' => false,
                'sort_order' => 3,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Unlimited postings for large energy employers.',
                'price_cents' => 79900,
                'interval' => 'month',
                // null, not 0: unlimited. Zero would mean a plan that grants
                // no postings at all.
                'job_limit' => null,
                'featured_job_limit' => 25,
                'job_duration_days' => 60,
                'is_popular' => false,
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            // Keyed on slug so re-seeding updates the tiers rather than
            // creating a second set alongside the live one.
            Plan::query()->updateOrCreate(
                ['slug' => $plan['slug']],
                $plan + ['currency' => 'USD', 'is_active' => true],
            );
        }
    }
}
