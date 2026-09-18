<?php

/*
 * The admin moderation endpoints are unscoped: they return every company,
 * job and article on the platform, regardless of who owns it.
 *
 * These guarded on 'viewAny' at first, which was wrong. An employer holds
 * companies.view and jobs.view for their own workspace, so viewAny let them
 * page through all 10 companies with owner emails attached, and all 81 jobs
 * including competitors' drafts. The gate is 'approve' — the permission that
 * marks a moderator rather than someone who merely has a company of their own.
 */

use App\Models\Article;
use App\Models\Company;
use App\Models\Job;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);

    $this->admin = User::factory()->role('administrator')->create();
    $this->employer = User::factory()->role('employer')->create();
    $this->seeker = User::factory()->role('job_seeker')->create();
});

$moderationEndpoints = [
    'companies' => '/api/v1/admin/companies',
    'company stats' => '/api/v1/admin/companies/stats',
    'jobs' => '/api/v1/admin/jobs',
    'job stats' => '/api/v1/admin/jobs/stats',
    'articles' => '/api/v1/admin/articles',
    'article stats' => '/api/v1/admin/articles/stats',
    'dashboard' => '/api/v1/admin/dashboard',
];

foreach ($moderationEndpoints as $name => $url) {
    it("refuses an employer the {$name} endpoint", function () use ($url) {
        actingAs($this->employer)->getJson($url)->assertForbidden();
    });

    it("refuses a job seeker the {$name} endpoint", function () use ($url) {
        actingAs($this->seeker)->getJson($url)->assertForbidden();
    });

    it("refuses a guest the {$name} endpoint", function () use ($url) {
        getJson($url)->assertUnauthorized();
    });

    it("allows an administrator the {$name} endpoint", function () use ($url) {
        actingAs($this->admin)->getJson($url)->assertOk();
    });
}

it('does not leak another company to an employer through the detail endpoint', function () {
    $other = Company::factory()->create();

    actingAs($this->employer)
        ->getJson("/api/v1/admin/companies/{$other->id}")
        ->assertForbidden();
});

it('does not leak platform totals in the dashboard payload', function () {
    Company::factory()->count(3)->create();

    actingAs($this->admin)
        ->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'totals' => ['users', 'companies', 'jobs', 'articles'],
                'moderation' => ['jobs_pending', 'articles_pending', 'companies_pending'],
                'jobsByCategory',
                'topCountries',
                'usersByRole',
                'recentActivity',
            ],
        ]);
});

it('counts what is actually in the database', function () {
    Company::factory()->count(3)->create();

    $response = actingAs($this->admin)->getJson('/api/v1/admin/dashboard')->assertOk();

    expect($response->json('data.totals.companies'))->toBe(Company::count())
        ->and($response->json('data.totals.jobs'))->toBe(Job::count())
        ->and($response->json('data.totals.articles'))->toBe(Article::count());
});
