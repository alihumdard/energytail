<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Product and course placements (Phase 3). Kept separate from ad
        // creatives because these are curated affiliate links with their own
        // metadata, not bought banner inventory.
        Schema::create('affiliate_items', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();

            // product, course, book, tool
            $table->string('type', 32)->default('product');
            $table->string('provider')->nullable();
            $table->string('target_url');

            $table->decimal('price', 12, 2)->nullable();
            $table->char('currency', 3)->nullable();

            // Optional targeting, so an item can be shown only alongside
            // matching content rather than site-wide.
            $table->foreignId('job_category_id')->nullable()
                ->constrained('job_categories')->nullOnDelete();
            $table->foreignId('article_category_id')->nullable()
                ->constrained('article_categories')->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_items');
    }
};
