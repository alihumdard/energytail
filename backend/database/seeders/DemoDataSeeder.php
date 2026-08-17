<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Company;
use App\Models\Job;
use App\Models\Skill;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo content for the Phase 1 client review.
 *
 * Kept apart from the taxonomy and settings seeders because this data is
 * disposable — production runs the others but never this one.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // No progress output here: db:seed already reports each seeder, and
        // writing to $this->command breaks when a test invokes the seeder
        // directly, where no console is attached.
        $this->seedKnownAccounts();
        $this->seedEmployersAndJobs();
        $this->seedAuthorsAndArticles();
        $this->seedJobSeekers();
    }

    /**
     * Fixed credentials so the client can log in during the review without
     * hunting through generated data.
     */
    private function seedKnownAccounts(): void
    {
        $accounts = [
            ['admin@energytail.com', 'Super', 'Admin', 'administrator'],
            ['employer@energytail.com', 'Sarah', 'Khan', 'employer'],
            ['seeker@energytail.com', 'Ali', 'Raza', 'job_seeker'],
            ['author@energytail.com', 'Ayesha', 'Malik', 'author'],
        ];

        foreach ($accounts as [$email, $first, $last, $role]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'first_name' => $first,
                    'last_name' => $last,
                    'name' => "{$first} {$last}",
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]
            );

            $user->syncRoles([$role]);
        }
    }

    private function seedEmployersAndJobs(): void
    {
        $skillIds = Skill::pluck('id');
        $tagIds = Tag::pluck('id');

        // The demo employer owns a company, so logging in as that account
        // shows a populated dashboard rather than an empty state.
        $demoEmployer = User::where('email', 'employer@energytail.com')->first();

        $companies = collect();

        if ($demoEmployer) {
            $companies->push(
                Company::factory()->featured()->create([
                    'owner_id' => $demoEmployer->id,
                    'name' => 'PetroEnergy Solutions',
                    'slug' => 'petroenergy-solutions',
                    'email' => 'hr@petroenergy.com',
                ])
            );
        }

        $companies = $companies->merge(
            Company::factory()->count(9)->create()->each(function (Company $company) {
                $company->owner->assignRole('employer');
            })
        );

        foreach ($companies as $company) {
            $published = Job::factory()->count(fake()->numberBetween(3, 8))->create([
                'company_id' => $company->id,
                'posted_by' => $company->owner_id,
            ]);

            Job::factory()->count(2)->expired()->create([
                'company_id' => $company->id,
                'posted_by' => $company->owner_id,
            ]);

            Job::factory()->draft()->create([
                'company_id' => $company->id,
                'posted_by' => $company->owner_id,
            ]);

            foreach ($published as $job) {
                $job->skills()->attach(
                    $skillIds->random(fake()->numberBetween(3, 6))->all()
                );
                $job->tags()->attach(
                    $tagIds->random(fake()->numberBetween(2, 4))->all()
                );
            }

            // Keep the denormalised counter honest with what was created.
            $company->update([
                'jobs_count' => $company->jobs()
                    ->where('status', Job::STATUS_PUBLISHED)->count(),
            ]);
        }
    }

    private function seedAuthorsAndArticles(): void
    {
        $tagIds = Tag::pluck('id');

        $demoAuthor = User::where('email', 'author@energytail.com')->first();

        $authors = User::factory()->count(3)->create()
            ->each(fn (User $user) => $user->assignRole('author'));

        if ($demoAuthor) {
            $authors->push($demoAuthor);
        }

        foreach ($authors as $author) {
            $articles = Article::factory()->count(2)->create(['author_id' => $author->id]);

            Article::factory()->draft()->create(['author_id' => $author->id]);
            Article::factory()->pendingReview()->create(['author_id' => $author->id]);

            foreach ($articles as $article) {
                $article->tags()->attach($tagIds->random(2)->all());
            }
        }
    }

    private function seedJobSeekers(): void
    {
        $seekers = User::factory()->count(15)->create()
            ->each(fn (User $user) => $user->assignRole('job_seeker'));

        $demoSeeker = User::where('email', 'seeker@energytail.com')->first();

        if ($demoSeeker) {
            $seekers->push($demoSeeker);
        }

        $jobIds = Job::where('status', Job::STATUS_PUBLISHED)->pluck('id');

        if ($jobIds->isEmpty()) {
            return;
        }

        foreach ($seekers as $seeker) {
            $seeker->savedJobs()->syncWithoutDetaching(
                $jobIds->random(min(4, $jobIds->count()))->all()
            );
        }
    }
}
