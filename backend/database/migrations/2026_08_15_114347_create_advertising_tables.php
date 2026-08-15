<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named slots the client can sell: homepage_top, sidebar,
        // article_inline, company_page, dashboard. Seeded, not user-created,
        // because each slot needs a matching render location in the frontend.
        Schema::create('ad_placements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();

            // How many creatives may rotate in this slot at once.
            $table->unsignedTinyInteger('max_slots')->default(1);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');

            // Either an internal campaign or one bought by a company.
            $table->foreignId('company_id')->nullable()
                ->constrained('companies')->nullOnDelete();
            $table->string('advertiser_name')->nullable();
            $table->string('advertiser_email')->nullable();

            // draft, scheduled, active, paused, completed
            $table->string('status', 20)->default('draft');

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();

            // cpm, cpc, fixed
            $table->string('pricing_model', 16)->default('fixed');
            $table->decimal('budget', 12, 2)->nullable();
            $table->char('currency', 3)->nullable();

            // Left unconstrained until the commerce tables land, so the
            // payment gateway decision does not block this migration.
            $table->unsignedBigInteger('order_id')->nullable();

            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'starts_at', 'ends_at']);
        });

        Schema::create('ad_creatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_placement_id')->constrained()->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->string('image_path')->nullable();
            $table->text('html')->nullable();
            $table->string('target_url');
            $table->string('alt_text')->nullable();

            // Relative weight when several creatives share a slot.
            $table->unsignedSmallInteger('weight')->default(1);
            $table->boolean('is_active')->default(true);

            $table->unsignedBigInteger('impressions_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);

            $table->timestamps();

            $table->index(['ad_placement_id', 'is_active']);
        });

        // Impressions are high volume. Stored as daily aggregates rather than
        // one row per view — a raw events table here would dwarf every other
        // table on the platform within weeks.
        Schema::create('ad_impressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_creative_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedBigInteger('impressions')->default(0);

            $table->unique(['ad_creative_id', 'date']);
            $table->index('date');
        });

        Schema::create('ad_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ad_creative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('visitor_hash', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('referrer')->nullable();
            $table->boolean('is_suspected_bot')->default(false);

            $table->timestamp('clicked_at')->useCurrent();

            $table->index(['ad_creative_id', 'clicked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_clicks');
        Schema::dropIfExists('ad_impressions');
        Schema::dropIfExists('ad_creatives');
        Schema::dropIfExists('ad_campaigns');
        Schema::dropIfExists('ad_placements');
    }
};
