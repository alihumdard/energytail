<?php

/*
 * Subscription billing.
 *
 * The rules that carry money or access:
 *
 *  - a plan's job limit must actually stop a posting, or plans are decorative;
 *  - a webhook without a valid signature must be refused, because it is
 *    otherwise an unauthenticated way to mark any subscription paid;
 *  - the same webhook delivered twice must not be applied twice.
 */

use App\Models\Company;
use App\Models\Country;
use App\Models\JobCategory;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\WebhookEvent;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\TaxonomySeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(TaxonomySeeder::class);
    $this->seed(PlanSeeder::class);

    $this->employer = User::factory()->role('employer')->create();
    $this->company = Company::factory()->create([
        'owner_id' => $this->employer->id,
        'status' => Company::STATUS_ACTIVE,
    ]);
});

/** A job payload that passes validation. */
function billingJobPayload(string $title = 'Test Role'): array
{
    return [
        'title' => $title,
        'description' => 'A description long enough to satisfy the fifty character minimum the API enforces on every listing.',
        'job_category_id' => JobCategory::first()->id,
        'country_id' => Country::first()->id,
        'employment_type' => 'full_time',
        'apply_method' => 'email',
        'apply_email' => 'jobs@example.com',
        'status' => 'draft',
    ];
}

// ------------------------------------------------------------------ plans

it('serves the plan catalogue to guests', function () {
    // A pricing page has to be readable by someone deciding whether to sign up.
    $response = getJson('/api/v1/plans')->assertOk();

    expect($response->json('data'))->not->toBeEmpty();
});

it('reports prices in cents, not as floats', function () {
    $response = getJson('/api/v1/plans')->assertOk();

    $professional = collect($response->json('data'))->firstWhere('slug', 'professional');

    // Floats cannot represent 99.00 exactly, and a rounding error in billing
    // is money quietly appearing or disappearing.
    expect($professional['price_cents'])->toBe(9900)
        ->and($professional['price_cents'])->toBeInt();
});

it('treats unlimited as null rather than zero', function () {
    $enterprise = Plan::where('slug', 'enterprise')->first();

    // Zero would mean a plan granting no postings at all.
    expect($enterprise->job_limit)->toBeNull()
        ->and($enterprise->hasUnlimitedJobs())->toBeTrue();
});

// ---------------------------------------------------------- subscribing

it('assigns a free plan without going through Stripe', function () {
    actingAs($this->employer)
        ->postJson('/api/v1/employer/billing/subscribe', ['plan' => 'starter'])
        ->assertOk();

    expect(Subscription::where('company_id', $this->company->id)->exists())->toBeTrue();
});

it('refuses a paid plan when Stripe is not configured', function () {
    config(['services.stripe.secret' => null, 'services.stripe.key' => null]);

    // Refused clearly rather than half-working: a checkout that silently does
    // nothing is worse than one that says it is not configured.
    actingAs($this->employer)
        ->postJson('/api/v1/employer/billing/subscribe', ['plan' => 'professional'])
        ->assertStatus(422);
});

it('refuses to subscribe twice to the same plan', function () {
    actingAs($this->employer)
        ->postJson('/api/v1/employer/billing/subscribe', ['plan' => 'starter'])
        ->assertOk();

    actingAs($this->employer)
        ->postJson('/api/v1/employer/billing/subscribe', ['plan' => 'starter'])
        ->assertStatus(422);
});

// --------------------------------------------------------- posting limits

it('lets an employer post within their plan limit', function () {
    $starter = Plan::where('slug', 'starter')->first();

    Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => $starter->id,
        'status' => Subscription::STATUS_ACTIVE,
    ]);

    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertCreated();
});

it('blocks a posting once the plan limit is used up', function () {
    $starter = Plan::where('slug', 'starter')->first();

    Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => $starter->id,
        'status' => Subscription::STATUS_ACTIVE,
        // Starter grants one posting, already spent.
        'jobs_used' => 1,
    ]);

    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertStatus(422)
        ->assertJsonValidationErrors('plan');
});

it('counts a posting against the plan', function () {
    $starter = Plan::where('slug', 'starter')->first();

    $subscription = Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => $starter->id,
        'status' => Subscription::STATUS_ACTIVE,
    ]);

    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertCreated();

    expect($subscription->fresh()->jobs_used)->toBe(1);
});

it('does not block a company that has no subscription at all', function () {
    // Billing is being introduced to a board that already has employers on
    // it; cutting them off the day it ships is a change nobody agreed to.
    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertCreated();
});

it('blocks posting when the subscription is not valid', function () {
    $plan = Plan::where('slug', 'professional')->first();

    Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_CANCELED,
    ]);

    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertStatus(422);
});

it('keeps a past_due subscription working', function () {
    $plan = Plan::where('slug', 'professional')->first();

    Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => $plan->id,
        'status' => Subscription::STATUS_PAST_DUE,
    ]);

    // A card that failed this morning should not take an employer's listings
    // down before Stripe has finished retrying.
    actingAs($this->employer)
        ->postJson('/api/v1/employer/jobs', billingJobPayload())
        ->assertCreated();
});

// -------------------------------------------------------------- webhooks

it('refuses a webhook with no signature', function () {
    // The signature is the only thing between this endpoint and anyone who
    // can POST to it.
    postJson('/api/v1/webhooks/stripe', ['id' => 'evt_test', 'type' => 'invoice.paid'])
        ->assertStatus(400);

    expect(WebhookEvent::count())->toBe(0);
});

it('refuses a webhook when no signing secret is configured', function () {
    config(['services.stripe.webhook_secret' => null]);

    postJson('/api/v1/webhooks/stripe', ['id' => 'evt_test', 'type' => 'invoice.paid'])
        ->assertStatus(400);
});

// ------------------------------------------------------------ entitlement

it('does not let another company see this company\'s billing', function () {
    $otherEmployer = User::factory()->role('employer')->create();
    Company::factory()->create([
        'owner_id' => $otherEmployer->id,
        'status' => Company::STATUS_ACTIVE,
    ]);

    Subscription::factory()->create([
        'company_id' => $this->company->id,
        'plan_id' => Plan::where('slug', 'professional')->first()->id,
        'status' => Subscription::STATUS_ACTIVE,
    ]);

    $response = actingAs($otherEmployer)->getJson('/api/v1/employer/billing')->assertOk();

    // They see their own company, which has no subscription — never ours.
    expect($response->json('data.subscription'))->toBeNull();
});

it('refuses billing to a guest', function () {
    getJson('/api/v1/employer/billing')->assertUnauthorized();
});
