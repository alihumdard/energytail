<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'job_id']);
            $table->index(['user_id', 'created_at']);
        });

        // Browsing history, capped in application code to the most recent
        // entries per user and written from a queued job.
        Schema::create('job_view_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at')->useCurrent();

            // One row per user/job, refreshed on revisit rather than appended,
            // so the history shows distinct jobs rather than repeats.
            $table->unique(['user_id', 'job_id']);
            $table->index(['user_id', 'viewed_at']);
        });

        // Category and country based job alerts (Phase 3 delivery, schema now).
        Schema::create('job_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('name')->nullable();
            $table->string('keywords')->nullable();

            $table->foreignId('job_category_id')->nullable()
                ->constrained('job_categories')->nullOnDelete();
            $table->foreignId('industry_id')->nullable()
                ->constrained('industries')->nullOnDelete();
            $table->foreignId('country_id')->nullable()
                ->constrained('countries')->nullOnDelete();
            $table->foreignId('city_id')->nullable()
                ->constrained('cities')->nullOnDelete();

            $table->string('employment_type', 32)->nullable();
            $table->boolean('is_remote')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();

            // daily, weekly, instant
            $table->string('frequency', 16)->default('daily');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sent_at')->nullable();

            $table->timestamps();

            $table->index(['is_active', 'frequency']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_alerts');
        Schema::dropIfExists('job_view_history');
        Schema::dropIfExists('saved_jobs');
    }
};
