<?php

use App\Models\Article;
use App\Models\ArticleCategory;
use App\Models\City;
use App\Models\Comment;
use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Job;
use App\Models\JobCategory;
use App\Models\Skill;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Exercises the schema through Eloquent rather than trusting that migrations
 * running means the model layer is correct. Catches wrong foreign keys, bad
 * pivot table names and missing casts — none of which `migrate` would reveal.
 */
function makeCountryAndCity(): array
{
    $country = Country::create([
        'name' => 'United Arab Emirates', 'slug' => 'uae', 'code' => 'AE',
    ]);

    $city = City::create([
        'country_id' => $country->id, 'name' => 'Dubai', 'slug' => 'dubai',
    ]);

    return [$country, $city];
}

it('links a city to its country in both directions', function () {
    [$country, $city] = makeCountryAndCity();

    expect($city->country->name)->toBe('United Arab Emirates')
        ->and($country->cities)->toHaveCount(1);
});

it('scopes taxonomy to active and ordered rows', function () {
    Country::create(['name' => 'Active One', 'slug' => 'a1', 'code' => 'A1', 'sort_order' => 2]);
    Country::create(['name' => 'Active Two', 'slug' => 'a2', 'code' => 'A2', 'sort_order' => 1]);
    Country::create(['name' => 'Hidden', 'slug' => 'h1', 'code' => 'H1', 'is_active' => false]);

    $rows = Country::active()->ordered()->get();

    expect($rows)->toHaveCount(2)
        ->and($rows->first()->name)->toBe('Active Two');
});

it('builds a full job with company, taxonomy, skills and tags', function () {
    [$country, $city] = makeCountryAndCity();

    $employer = User::factory()->create();
    $industry = Industry::create(['name' => 'Oil & Gas', 'slug' => 'oil-gas']);
    $category = JobCategory::create(['name' => 'Drilling', 'slug' => 'drilling']);

    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'PetroEnergy Solutions',
        'slug' => 'petroenergy-solutions',
        'industry_id' => $industry->id,
        'country_id' => $country->id,
        'city_id' => $city->id,
        'status' => Company::STATUS_ACTIVE,
    ]);

    $job = Job::create([
        'reference' => 'ET-2458',
        'company_id' => $company->id,
        'posted_by' => $employer->id,
        'title' => 'Senior Drilling Engineer',
        'slug' => 'senior-drilling-engineer-petroenergy',
        'job_category_id' => $category->id,
        'industry_id' => $industry->id,
        'country_id' => $country->id,
        'city_id' => $city->id,
        'employment_type' => 'full_time',
        'salary_min' => 120000,
        'salary_max' => 150000,
        'salary_currency' => 'USD',
        'apply_method' => Job::APPLY_EXTERNAL_URL,
        'apply_url' => 'https://petroenergy.com/careers/2458',
        'status' => Job::STATUS_PUBLISHED,
        'published_at' => now(),
        'deadline_at' => now()->addDays(30),
    ]);

    $skill = Skill::create(['name' => 'Well Control', 'slug' => 'well-control']);
    $job->skills()->attach($skill->id, ['is_required' => true]);

    $tag = Tag::create(['name' => 'Urgent Hiring', 'slug' => 'urgent-hiring']);
    $job->tags()->attach($tag->id);

    $job->refresh();

    expect($job->company->name)->toBe('PetroEnergy Solutions')
        ->and($job->category->name)->toBe('Drilling')
        ->and($job->city->country->code)->toBe('AE')
        ->and($job->skills)->toHaveCount(1)
        ->and($job->tags)->toHaveCount(1)
        ->and($job->applyTarget())->toBe('https://petroenergy.com/careers/2458');
});

it('casts job dates and booleans rather than returning raw strings', function () {
    [$country, $city] = makeCountryAndCity();
    $employer = User::factory()->create();

    $company = Company::create([
        'owner_id' => $employer->id, 'name' => 'Acme', 'slug' => 'acme',
    ]);

    $job = Job::create([
        'reference' => 'ET-1', 'company_id' => $company->id,
        'title' => 'Engineer', 'slug' => 'engineer-acme',
        'apply_method' => Job::APPLY_EMAIL, 'apply_email' => 'jobs@acme.com',
        'deadline_at' => now()->subDay(), 'is_remote' => true,
    ]);

    expect($job->deadline_at)->toBeInstanceOf(Carbon::class)
        ->and($job->is_remote)->toBeTrue()
        ->and($job->hasExpired())->toBeTrue()
        ->and($job->applyTarget())->toBe('jobs@acme.com');
});

it('only returns published, unexpired jobs from the public scopes', function () {
    $employer = User::factory()->create();
    $company = Company::create([
        'owner_id' => $employer->id, 'name' => 'Acme', 'slug' => 'acme',
    ]);

    $base = ['company_id' => $company->id, 'apply_method' => Job::APPLY_EXTERNAL_URL];

    Job::create([...$base, 'reference' => 'ET-1', 'title' => 'Live', 'slug' => 'live',
        'status' => Job::STATUS_PUBLISHED, 'published_at' => now()->subDay(),
        'deadline_at' => now()->addDays(10)]);

    Job::create([...$base, 'reference' => 'ET-2', 'title' => 'Draft', 'slug' => 'draft',
        'status' => Job::STATUS_DRAFT]);

    Job::create([...$base, 'reference' => 'ET-3', 'title' => 'Stale', 'slug' => 'stale',
        'status' => Job::STATUS_PUBLISHED, 'published_at' => now()->subDays(60),
        'deadline_at' => now()->subDay()]);

    $live = Job::published()->notExpired()->get();

    expect($live)->toHaveCount(1)
        ->and($live->first()->title)->toBe('Live');
});

it('nests article comments and distinguishes guest from registered authors', function () {
    $author = User::factory()->create(['first_name' => 'Ada', 'last_name' => 'Lovelace']);
    $category = ArticleCategory::create(['name' => 'LNG', 'slug' => 'lng']);

    $article = Article::create([
        'author_id' => $author->id,
        'article_category_id' => $category->id,
        'title' => 'LNG Demand to Surge in Asia',
        'slug' => 'lng-demand-surge-asia',
        'status' => Article::STATUS_PUBLISHED,
        'published_at' => now(),
    ]);

    $parent = Comment::create([
        'article_id' => $article->id, 'user_id' => $author->id,
        'body' => 'Useful analysis.', 'status' => Comment::STATUS_APPROVED,
    ]);

    Comment::create([
        'article_id' => $article->id, 'parent_id' => $parent->id,
        'guest_name' => 'Visitor', 'body' => 'Agreed.',
        'status' => Comment::STATUS_APPROVED,
    ]);

    $article->refresh();

    expect($article->author->full_name)->toBe('Ada Lovelace')
        ->and($article->approvedComments)->toHaveCount(1)
        ->and($parent->replies)->toHaveCount(1)
        ->and($parent->authorName())->toBe('Ada Lovelace')
        ->and($parent->replies->first()->authorName())->toBe('Visitor');
});

it('cascades deletes from company to jobs but preserves taxonomy', function () {
    [$country] = makeCountryAndCity();
    $employer = User::factory()->create();
    $industry = Industry::create(['name' => 'LNG', 'slug' => 'lng-ind']);

    $company = Company::create([
        'owner_id' => $employer->id, 'name' => 'Acme', 'slug' => 'acme',
        'industry_id' => $industry->id, 'country_id' => $country->id,
    ]);

    Job::create([
        'reference' => 'ET-9', 'company_id' => $company->id,
        'title' => 'Engineer', 'slug' => 'engineer-acme',
        'apply_method' => Job::APPLY_EXTERNAL_URL,
    ]);

    // forceDelete bypasses soft deletes so the database constraint is what
    // actually runs here.
    $company->forceDelete();

    expect(Job::count())->toBe(0)
        ->and(Industry::count())->toBe(1)
        ->and(Country::count())->toBe(1);
});
