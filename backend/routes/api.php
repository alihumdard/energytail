<?php

use App\Http\Controllers\Api\V1\Admin\AdminArticleController;
use App\Http\Controllers\Api\V1\Admin\AdminCommentController;
use App\Http\Controllers\Api\V1\Admin\AdminCompanyController;
use App\Http\Controllers\Api\V1\Admin\AdminJobController;
use App\Http\Controllers\Api\V1\Admin\AuditLogController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\MailHealthController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\ArticleCategoryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\CityController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\CountryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\IndustryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\JobCategoryController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\SkillController;
use App\Http\Controllers\Api\V1\Admin\Taxonomy\TagController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\EmailAvailabilityController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\Auth\SocialAuthController;
use App\Http\Controllers\Api\V1\Author\AuthorArticleController;
use App\Http\Controllers\Api\V1\Billing\BillingController;
use App\Http\Controllers\Api\V1\Billing\StripeWebhookController;
use App\Http\Controllers\Api\V1\Employer\EmployerCompanyController;
use App\Http\Controllers\Api\V1\Employer\EmployerJobController;
use App\Http\Controllers\Api\V1\Public\CommentController;
use App\Http\Controllers\Api\V1\Public\HomeController;
use App\Http\Controllers\Api\V1\Public\JobApplyController;
use App\Http\Controllers\Api\V1\Public\NewsletterController;
use App\Http\Controllers\Api\V1\Public\PublicArticleController;
use App\Http\Controllers\Api\V1\Public\PublicCompanyController;
use App\Http\Controllers\Api\V1\Public\PublicJobController;
use App\Http\Controllers\Api\V1\Public\PublicTaxonomyController;
use App\Http\Controllers\Api\V1\Public\SitemapController;
use App\Http\Controllers\Api\V1\Seeker\CertificateController;
use App\Http\Controllers\Api\V1\Seeker\EducationController;
use App\Http\Controllers\Api\V1\Seeker\ExperienceController;
use App\Http\Controllers\Api\V1\Seeker\JobAlertController;
use App\Http\Controllers\Api\V1\Seeker\LanguageController;
use App\Http\Controllers\Api\V1\Seeker\PortfolioController;
use App\Http\Controllers\Api\V1\Seeker\ProfileController;
use App\Http\Controllers\Api\V1\Seeker\SavedJobController;
use App\Http\Controllers\Api\V1\Seeker\SeekerDashboardController;
use App\Http\Controllers\Api\V1\Seeker\SeekerProfileController;
use App\Http\Controllers\Api\V1\Seeker\SeekerSkillController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (prefix: /api/v1)
|--------------------------------------------------------------------------
|
| The prefix is set in bootstrap/app.php via withRouting(apiPrefix: 'api/v1').
|
| Route groups are added per work package:
|   WP1.3  auth (below)      WP1.5  taxonomy
|   WP1.4  roles             WP1.6  users, settings, audit logs
|
*/

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'environment' => config('app.env'),
        'timestamp' => now()->toIso8601String(),
    ]);
})->name('api.health');

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->name('api.auth.')->group(function () {

    // Guests only. Throttled because these endpoints are the ones worth
    // brute-forcing: credentials, account creation and reset tokens.
    //
    // 'guest.api' rather than Laravel's 'guest': the stock middleware answers
    // an authenticated caller with an HTML redirect, which the SPA cannot
    // parse and surfaced to the user as a silent failure.
    // 'captcha' is inert until CAPTCHA_ENABLED is set, so local development
    // and the test suite need no keys.
    Route::middleware(['guest.api', 'throttle:auth', 'captcha'])->group(function () {
        Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
        Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
        Route::post('/password/forgot', [PasswordController::class, 'forgot'])->name('password.forgot');
        Route::post('/password/reset', [PasswordController::class, 'reset'])->name('password.reset');
    });

    // Throttled harder than the forms it serves: it fires while the user is
    // still typing, and it must not become a way to enumerate members.
    Route::post('/email/available', EmailAvailabilityController::class)
        ->middleware('throttle:20,1')
        ->name('email.available');

    // Verification links are opened from an email client, often in a browser
    // with no session, so this route cannot require authentication. The
    // signature plus the email hash are what secure it.
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('email.verify');

    // Social sign-in. Session-based, so these are GET redirects rather than
    // API calls the frontend makes with fetch.
    Route::middleware('throttle:auth')->group(function () {
        Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect'])
            ->name('social.redirect');
        Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback'])
            ->name('social.callback');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthenticatedSessionController::class, 'me'])->name('me');
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
        Route::put('/password', [PasswordController::class, 'change'])->name('password.change');

        Route::post('/email/resend', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:6,1')
            ->name('email.resend');
    });
});

/*
|--------------------------------------------------------------------------
| Verified accounts only
|--------------------------------------------------------------------------
|
| The plan draws the line at publishing, not at reading: a guest may search
| jobs, read articles and browse companies, but applying, posting a job and
| publishing an article are closed to them. Verification enforces the same
| boundary for signed-in users, so an unconfirmed address cannot apply or
| post either.
|
| Browsing and profile editing stay open on purpose. Search has to work for
| signed-out visitors for the SEO the plan asks for, and locking a user out
| of their own profile before they have opened their inbox reads as broken.
|
| The Phase 2 routes that belong here — applications, job posting, article
| submission — do not exist yet. This group is where they attach.
|
*/

Route::middleware(['auth:sanctum', 'active', 'verified'])->group(function () {
    /*
     * Applying is a click-through to the employer, recorded on the way past.
     * Throttled because the endpoint writes, and a listing's click count is
     * the only performance figure an employer gets — it should not be cheap
     * to inflate.
     */
    Route::post('/jobs/{slug}/apply', JobApplyController::class)
        ->middleware('throttle:30,1')
        ->name('api.jobs.apply');

    /*
     * Employer workspace.
     *
     * Verified as well as signed in, like applying: the plan closes posting
     * to unconfirmed accounts, and a listing is public content carrying a
     * company's name.
     *
     * Every route is scoped to the companies the caller may act for, by both
     * the query and JobPolicy — holding jobs.edit must never mean editing a
     * competitor's listing.
     */
    Route::prefix('employer')->name('api.employer.')->group(function () {
        Route::get('/jobs', [EmployerJobController::class, 'index'])->name('jobs.index');
        Route::get('/jobs/stats', [EmployerJobController::class, 'stats'])->name('jobs.stats');
        Route::post('/jobs', [EmployerJobController::class, 'store'])->name('jobs.store');
        Route::get('/jobs/{job:id}', [EmployerJobController::class, 'show'])->name('jobs.show');
        Route::put('/jobs/{job:id}', [EmployerJobController::class, 'update'])->name('jobs.update');
        Route::patch('/jobs/{job:id}/close', [EmployerJobController::class, 'close'])->name('jobs.close');
        Route::patch('/jobs/{job:id}/reopen', [EmployerJobController::class, 'reopen'])->name('jobs.reopen');

        // The caller's own company. Ownership is enforced by CompanyPolicy —
        // holding companies.edit never means editing a competitor's page.
        Route::get('/company', [EmployerCompanyController::class, 'show'])->name('company.show');
        Route::post('/company', [EmployerCompanyController::class, 'store'])->name('company.store');
        Route::put('/company/{company:id}', [EmployerCompanyController::class, 'update'])->name('company.update');

        // Billing for the caller's own company.
        Route::get('/billing', [BillingController::class, 'overview'])->name('billing.overview');
        Route::post('/billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
        Route::post('/billing/cancel', [BillingController::class, 'cancel'])->name('billing.cancel');
    });

    /*
     * Candidate workspace.
     *
     * Saved jobs and alerts, each scoped to the caller by user_id on every
     * path. Verified as well as signed in, matching the rest of this group.
     */
    Route::prefix('seeker')->name('api.seeker.')->group(function () {
        Route::get('/dashboard', SeekerDashboardController::class)->name('dashboard');

        Route::get('/saved-jobs', [SavedJobController::class, 'index'])->name('saved.index');
        Route::post('/saved-jobs', [SavedJobController::class, 'store'])->name('saved.store');
        Route::post('/saved-jobs/check', [SavedJobController::class, 'check'])->name('saved.check');
        Route::delete('/saved-jobs/{job}', [SavedJobController::class, 'destroy'])->name('saved.destroy');

        Route::get('/alerts', [JobAlertController::class, 'index'])->name('alerts.index');
        Route::post('/alerts', [JobAlertController::class, 'store'])->name('alerts.store');
        Route::put('/alerts/{alert}', [JobAlertController::class, 'update'])->name('alerts.update');
        Route::patch('/alerts/{alert}/toggle', [JobAlertController::class, 'toggle'])->name('alerts.toggle');
        Route::delete('/alerts/{alert}', [JobAlertController::class, 'destroy'])->name('alerts.destroy');

        /*
         * Profile and CVs. Resumes live on the private disk and are streamed
         * back through the download route — a public URL would expose every
         * candidate's address and phone number.
         */
        Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

        Route::get('/resumes', [ProfileController::class, 'resumes'])->name('resumes.index');
        Route::post('/resumes', [ProfileController::class, 'uploadResume'])->name('resumes.store');
        Route::get('/resumes/{resume}/download', [ProfileController::class, 'downloadResume'])->name('resumes.download');
        Route::patch('/resumes/{resume}/default', [ProfileController::class, 'setDefaultResume'])->name('resumes.default');
        Route::delete('/resumes/{resume}', [ProfileController::class, 'deleteResume'])->name('resumes.destroy');

        /*
         * The professional profile: headline, summary and what the candidate
         * is looking for. Separate from /profile above, which is the account
         * itself (name, phone, locale).
         */
        Route::get('/seeker-profile', [SeekerProfileController::class, 'show'])->name('seeker_profile.show');
        Route::put('/seeker-profile', [SeekerProfileController::class, 'update'])->name('seeker_profile.update');

        /*
         * The repeating CV sections. Every row is scoped to the caller in the
         * controller, so the id in the URL can only ever address the
         * candidate's own entry.
         */
        foreach ([
            'experiences' => ExperienceController::class,
            'educations' => EducationController::class,
            'certificates' => CertificateController::class,
            'languages' => LanguageController::class,
            'portfolio' => PortfolioController::class,
        ] as $segment => $controller) {
            Route::get("/{$segment}", [$controller, 'index'])->name("{$segment}.index");
            Route::post("/{$segment}", [$controller, 'store'])->name("{$segment}.store");
            // Before the {id} routes: otherwise "reorder" binds as an id.
            Route::put("/{$segment}/reorder", [$controller, 'reorder'])->name("{$segment}.reorder");
            Route::put("/{$segment}/{id}", [$controller, 'update'])->name("{$segment}.update");
            Route::delete("/{$segment}/{id}", [$controller, 'destroy'])->name("{$segment}.destroy");
        }

        // Skills are a pivot onto the shared taxonomy, so the whole set is
        // replaced at once rather than edited row by row.
        Route::get('/skills', [SeekerSkillController::class, 'index'])->name('skills.index');
        Route::put('/skills', [SeekerSkillController::class, 'sync'])->name('skills.sync');
    });

    /*
     * Author workspace.
     *
     * Scoped to the caller's own articles by both the query and
     * ArticlePolicy — holding articles.edit must never mean editing another
     * author's piece. Bound by id rather than the model's slug route key,
     * because editing the title changes the slug.
     */
    Route::prefix('author')->name('api.author.')->group(function () {
        Route::get('/articles', [AuthorArticleController::class, 'index'])->name('articles.index');
        Route::get('/articles/stats', [AuthorArticleController::class, 'stats'])->name('articles.stats');
        Route::post('/articles', [AuthorArticleController::class, 'store'])->name('articles.store');
        Route::get('/articles/{article:id}', [AuthorArticleController::class, 'show'])->name('articles.show');
        Route::put('/articles/{article:id}', [AuthorArticleController::class, 'update'])->name('articles.update');
        Route::delete('/articles/{article:id}', [AuthorArticleController::class, 'destroy'])->name('articles.destroy');
    });
});

/*
|--------------------------------------------------------------------------
| Public jobs
|--------------------------------------------------------------------------
|
| Open to guests. The plan lets anyone search jobs and browse companies, and
| server-side rendering of these pages is the whole SEO strategy — a crawler
| arrives with no session.
|
*/

Route::prefix('jobs')->name('api.jobs.')->group(function () {
    Route::get('/', [PublicJobController::class, 'index'])->name('index');
    Route::get('/{slug}', [PublicJobController::class, 'show'])->name('show');
    Route::get('/{slug}/related', [PublicJobController::class, 'related'])->name('related');
    Route::get('/{slug}/apply-target', [PublicJobController::class, 'applyTarget'])->name('apply_target');
});

/*
| Public articles. Open to guests for the same reason jobs are: the plan
| lets anyone read them, and these pages carry the SEO.
*/

/*
| Public companies. Only active ones appear — a suspended employer's page
| staying up would defeat the suspension.
*/

/*
| Billing.
|
| The plan catalogue is public — a pricing page has to be readable by someone
| deciding whether to sign up. The webhook is unauthenticated by necessity:
| Stripe has no session, so the signature is what secures it.
*/

Route::get('/plans', [BillingController::class, 'plans'])->name('api.plans');

/*
| The homepage payload, in one request. Six sequential round trips would be
| six chances to be slow on the page a crawler sees first.
*/
Route::get('/home', HomeController::class)->name('api.home');

/*
| Every public URL, for the sitemap the frontend serves. Slugs and timestamps
| only — paging the listing endpoints would be dozens of round trips shipping
| descriptions the sitemap has no use for.
*/
Route::get('/sitemap', SitemapController::class)->name('api.sitemap');

/*
 * Reporting a comment. Open to guests on purpose: the reader best placed to
 * notice abuse is the one reading the page, and requiring an account would
 * mean most abuse goes unreported.
 */
Route::post('/comments/{id}/report', [CommentController::class, 'report'])
    ->middleware('throttle:10,1')
    ->name('api.comments.report');

/*
| Newsletter. Confirmed opt-in: anyone can type someone else's address into a
| public form, so nothing is sent until the owner clicks the link. Throttled
| because it sends mail on an unauthenticated request.
*/
Route::prefix('newsletter')->name('api.newsletter.')->group(function () {
    Route::post('/subscribe', [NewsletterController::class, 'subscribe'])
        ->middleware('throttle:6,1')
        ->name('subscribe');
    Route::post('/confirm', [NewsletterController::class, 'confirm'])
        ->middleware('throttle:10,1')
        ->name('confirm');
    Route::post('/unsubscribe', [NewsletterController::class, 'unsubscribe'])
        ->middleware('throttle:10,1')
        ->name('unsubscribe');
});

Route::post('/webhooks/stripe', StripeWebhookController::class)
    ->name('api.webhooks.stripe');

Route::prefix('companies')->name('api.companies.')->group(function () {
    Route::get('/', [PublicCompanyController::class, 'index'])->name('index');
    Route::get('/{slug}', [PublicCompanyController::class, 'show'])->name('show');
    Route::get('/{slug}/jobs', [PublicCompanyController::class, 'jobs'])->name('jobs');
});

Route::prefix('articles')->name('api.articles.')->group(function () {
    Route::get('/', [PublicArticleController::class, 'index'])->name('index');
    Route::get('/{slug}', [PublicArticleController::class, 'show'])->name('show');
    Route::get('/{slug}/related', [PublicArticleController::class, 'related'])->name('related');

    /*
     * Reader comments. Reading is open — they are part of the page a crawler
     * indexes. Posting is throttled and depends on the administrator's
     * settings: comments can be off entirely, members-only, or held for
     * approval before they appear.
     */
    Route::get('/{slug}/comments', [CommentController::class, 'index'])->name('comments.index');
    Route::post('/{slug}/comments', [CommentController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('comments.store');

});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
|
| Every route requires an authenticated, non-suspended account. Finer-grained
| checks live in policies rather than here, so a permission change takes
| effect without a routing change.
|
*/

Route::prefix('admin')->name('api.admin.')
    ->middleware(['auth:sanctum', 'active'])
    ->group(function () {

        // Matrix definition first: a literal segment would otherwise be
        // captured by the {role} parameter on the resource routes below.
        Route::get('/roles/matrix', [RoleController::class, 'matrix'])->name('roles.matrix');

        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('/roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('/roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions'])
            ->name('roles.permissions.sync');
        Route::get('/roles/{role}/users', [RoleController::class, 'users'])->name('roles.users');

        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');

        /*
        | Users
        */
        Route::get('/users/stats', [UserController::class, 'stats'])->name('users.stats');
        Route::get('/users/export', [UserController::class, 'export'])->name('users.export');
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus'])->name('users.status');
        Route::post('/users/{user}/password-reset', [UserController::class, 'sendPasswordReset'])
            ->name('users.password_reset');

        /*
        | Settings
        */
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::post('/settings/file', [SettingController::class, 'uploadFile'])->name('settings.file');

        /*
         * Job moderation. Unlike the employer workspace this is unscoped —
         * an administrator sees every listing, because approving and pulling
         * them is the point.
         */
        Route::get('/jobs', [AdminJobController::class, 'index'])->name('jobs.index');
        Route::get('/jobs/stats', [AdminJobController::class, 'stats'])->name('jobs.stats');
        Route::patch('/jobs/{job:id}/approve', [AdminJobController::class, 'approve'])->name('jobs.approve');
        Route::patch('/jobs/{job:id}/reject', [AdminJobController::class, 'reject'])->name('jobs.reject');
        Route::patch('/jobs/{job:id}/featured', [AdminJobController::class, 'toggleFeatured'])->name('jobs.featured');
        Route::delete('/jobs/{job:id}', [AdminJobController::class, 'destroy'])->name('jobs.destroy');

        /*
         * Companies. Bound by id rather than the model's slug route key: an
         * administrator edits a company's name, and renaming changes the slug.
         */
        Route::get('/companies', [AdminCompanyController::class, 'index'])->name('companies.index');
        Route::get('/companies/stats', [AdminCompanyController::class, 'stats'])->name('companies.stats');
        Route::get('/companies/{company:id}', [AdminCompanyController::class, 'show'])->name('companies.show');
        Route::put('/companies/{company:id}', [AdminCompanyController::class, 'update'])->name('companies.update');
        Route::patch('/companies/{company:id}/approve', [AdminCompanyController::class, 'approve'])->name('companies.approve');
        Route::patch('/companies/{company:id}/suspend', [AdminCompanyController::class, 'suspend'])->name('companies.suspend');
        Route::patch('/companies/{company:id}/verified', [AdminCompanyController::class, 'toggleVerified'])->name('companies.verified');
        Route::patch('/companies/{company:id}/featured', [AdminCompanyController::class, 'toggleFeatured'])->name('companies.featured');

        /*
         * Articles. Bound by id rather than the model's slug route key: a
         * moderator edits the title, and retitling changes the slug.
         */
        // Platform overview: every figure counted at request time.
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        /*
         * Comment moderation. Gated on comments.approve inside the
         * controller, never comments.view — authors hold `view` for the
         * discussion under their own pieces, and this queue carries every
         * commenter's email address and IP.
         */
        Route::get('/comments', [AdminCommentController::class, 'index'])->name('comments.index');
        Route::get('/comments/stats', [AdminCommentController::class, 'stats'])->name('comments.stats');
        Route::patch('/comments/{comment}/status', [AdminCommentController::class, 'setStatus'])->name('comments.status');
        Route::delete('/comments/{comment}', [AdminCommentController::class, 'destroy'])->name('comments.destroy');

        Route::get('/articles', [AdminArticleController::class, 'index'])->name('articles.index');
        Route::get('/articles/stats', [AdminArticleController::class, 'stats'])->name('articles.stats');
        Route::get('/articles/{article:id}', [AdminArticleController::class, 'show'])->name('articles.show');
        Route::put('/articles/{article:id}', [AdminArticleController::class, 'update'])->name('articles.update');
        Route::patch('/articles/{article:id}/approve', [AdminArticleController::class, 'approve'])->name('articles.approve');
        Route::patch('/articles/{article:id}/reject', [AdminArticleController::class, 'reject'])->name('articles.reject');
        Route::patch('/articles/{article:id}/unpublish', [AdminArticleController::class, 'unpublish'])->name('articles.unpublish');
        Route::patch('/articles/{article:id}/featured', [AdminArticleController::class, 'toggleFeatured'])->name('articles.featured');
        Route::delete('/articles/{article:id}', [AdminArticleController::class, 'destroy'])->name('articles.destroy');

        // Whether outgoing mail actually works. Queued sends answer 200 the
        // moment the job is accepted, so a broken relay is otherwise
        // invisible from the admin screens.
        Route::get('/settings/mail-health', [MailHealthController::class, 'show'])
            ->name('settings.mail_health');

        Route::post('/settings/mail-test', [MailHealthController::class, 'send'])
            ->middleware('throttle:6,1')
            ->name('settings.mail_test');

        /*
        | Audit logs
        */
        Route::get('/audit-logs/filters', [AuditLogController::class, 'filters'])->name('audit.filters');
        Route::get('/audit-logs/stats', [AuditLogController::class, 'stats'])->name('audit.stats');
        Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->name('audit.export');
        Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit.index');

        /*
        | Taxonomy resources. All six share BaseTaxonomyController, so the
        | route shape is identical and registered from one loop rather than
        | repeated six times.
        */
        $taxonomies = [
            'industries' => IndustryController::class,
            'job-categories' => JobCategoryController::class,
            'article-categories' => ArticleCategoryController::class,
            'countries' => CountryController::class,
            'cities' => CityController::class,
            'skills' => SkillController::class,
            'tags' => TagController::class,
        ];

        foreach ($taxonomies as $slug => $controller) {
            Route::prefix($slug)->name(str_replace('-', '_', $slug).'.')->group(function () use ($controller) {
                // Literal segments first, so they are not swallowed by {id}.
                Route::get('/stats', [$controller, 'stats'])->name('stats');
                Route::get('/export', [$controller, 'export'])->name('export');
                Route::post('/reorder', [$controller, 'reorder'])->name('reorder');

                Route::get('/', [$controller, 'index'])->name('index');
                Route::post('/', [$controller, 'store'])->name('store');
                Route::get('/{id}', [$controller, 'show'])->whereNumber('id')->name('show');
                Route::put('/{id}', [$controller, 'update'])->whereNumber('id')->name('update');
                Route::delete('/{id}', [$controller, 'destroy'])->whereNumber('id')->name('destroy');
                Route::patch('/{id}/active', [$controller, 'toggleActive'])->whereNumber('id')->name('active');
            });
        }
    });

/*
|--------------------------------------------------------------------------
| Public Taxonomy
|--------------------------------------------------------------------------
|
| Read-only, unauthenticated, active records only. Feeds search filters and
| category landing pages on the public site.
|
*/

// Site name, logo, contact details — read on every page of the frontend.
Route::get('/settings', [SettingController::class, 'publicSettings'])->name('api.settings.public');

Route::prefix('taxonomies')->name('api.taxonomies.')->group(function () {
    Route::get('/', [PublicTaxonomyController::class, 'all'])->name('all');
    Route::get('/countries', [PublicTaxonomyController::class, 'countries'])->name('countries');
    Route::get('/cities', [PublicTaxonomyController::class, 'cities'])->name('cities');
    Route::get('/industries', [PublicTaxonomyController::class, 'industries'])->name('industries');
    Route::get('/job-categories', [PublicTaxonomyController::class, 'jobCategories'])->name('job_categories');
    Route::get('/article-categories', [PublicTaxonomyController::class, 'articleCategories'])->name('article_categories');
    Route::get('/skills', [PublicTaxonomyController::class, 'skills'])->name('skills');
    Route::get('/tags', [PublicTaxonomyController::class, 'tags'])->name('tags');
});
