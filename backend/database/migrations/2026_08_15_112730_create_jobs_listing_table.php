<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The platform's core entity. Laravel's queue table was renamed to
        // queue_jobs (see config/queue.php) so 'jobs' means job listings here.
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();

            // Public-facing reference shown in the UI as #ET-2458.
            $table->string('reference', 20)->unique();

            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('posted_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();

            $table->foreignId('job_category_id')->nullable()
                ->constrained('job_categories')->nullOnDelete();
            $table->foreignId('industry_id')->nullable()
                ->constrained('industries')->nullOnDelete();
            $table->foreignId('country_id')->nullable()
                ->constrained('countries')->nullOnDelete();
            $table->foreignId('city_id')->nullable()
                ->constrained('cities')->nullOnDelete();
            $table->string('location_label')->nullable();

            $table->string('employment_type', 32)->nullable();
            $table->boolean('is_remote')->default(false);

            $table->longText('description')->nullable();
            $table->longText('responsibilities')->nullable();
            $table->longText('requirements')->nullable();
            $table->longText('benefits')->nullable();

            // Ranges are stored as separate bounds so filtering can compare
            // numerically; the display string is composed in the API layer.
            $table->unsignedSmallInteger('experience_min')->nullable();
            $table->unsignedSmallInteger('experience_max')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->char('salary_currency', 3)->nullable();
            $table->string('salary_period', 16)->nullable();
            $table->boolean('salary_is_hidden')->default(false);

            // Applications leave the platform entirely — see the plan's
            // Application Redirect System. 'external_url' or 'email'.
            $table->string('apply_method', 20)->default('external_url');
            $table->string('apply_url')->nullable();
            $table->string('apply_email')->nullable();

            // draft, pending_review, published, expired, closed
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_urgent')->default(false);
            $table->boolean('is_highlighted')->default(false);

            $table->timestamp('published_at')->nullable();
            $table->date('deadline_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            // Denormalised counters flushed from Redis on a schedule rather
            // than incremented per request. See WP2.4.
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('apply_clicks_count')->default(0);

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Nearly every public query filters on status and orders by
            // published_at, so they are indexed together.
            $table->index(['status', 'published_at']);
            $table->index(['status', 'deadline_at']);
            $table->index(['company_id', 'status']);
            $table->index(['country_id', 'city_id']);
            $table->index('job_category_id');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
