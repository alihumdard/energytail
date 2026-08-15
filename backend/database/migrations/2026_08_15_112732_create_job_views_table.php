<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw view events, written from a queued job so a page render never
        // waits on the insert. Deduplicated in application code by
        // visitor_hash within a 24h window before a row is written.
        Schema::create('job_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            // Salted hash of IP + user agent. Avoids storing a raw IP against
            // an identifiable visitor while still supporting deduplication.
            $table->string('visitor_hash', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('referrer')->nullable();
            $table->string('country_code', 2)->nullable();

            $table->timestamp('viewed_at')->useCurrent();

            $table->index(['job_id', 'viewed_at']);
            $table->index(['visitor_hash', 'viewed_at']);
        });

        // Pre-aggregated daily rollups. The employer dashboard's "views this
        // week" and trend percentages read from here instead of scanning the
        // raw events table, which grows without bound.
        Schema::create('job_view_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('unique_views')->default(0);

            $table->unique(['job_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_view_daily');
        Schema::dropIfExists('job_views');
    }
};
