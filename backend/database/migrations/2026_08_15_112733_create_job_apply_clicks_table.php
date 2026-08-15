<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The metric the whole business model rests on: the platform cannot
        // see what happens after the redirect, so this is the only proof of
        // value delivered to an employer. Accuracy matters more here than
        // anywhere else in the schema.
        Schema::create('job_apply_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('visitor_hash', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('referrer')->nullable();
            $table->string('country_code', 2)->nullable();

            // Which route the click took: external_url or email.
            $table->string('apply_method', 20);

            // Flagged rather than deleted, so bot filtering can be audited and
            // tuned after the fact instead of silently losing data.
            $table->boolean('is_suspected_bot')->default(false);

            $table->timestamp('clicked_at')->useCurrent();

            $table->index(['job_id', 'clicked_at']);
            $table->index(['visitor_hash', 'clicked_at']);
            $table->index('is_suspected_bot');
        });

        Schema::create('job_apply_click_daily', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('clicks')->default(0);
            $table->unsignedInteger('unique_clicks')->default(0);

            $table->unique(['job_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_apply_click_daily');
        Schema::dropIfExists('job_apply_clicks');
    }
};
