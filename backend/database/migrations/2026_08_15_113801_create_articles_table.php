<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('article_category_id')->nullable()
                ->constrained('article_categories')->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body')->nullable();

            $table->string('featured_image_path')->nullable();
            $table->string('featured_image_alt')->nullable();

            // draft, pending_review, scheduled, published, rejected
            // 'scheduled' exists because the admin design shows it, though the
            // plan document omits scheduled publishing. See conflict C5.
            $table->string('status', 20)->default('draft');

            $table->foreignId('reviewed_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_for')->nullable();

            $table->boolean('is_featured')->default(false);
            $table->boolean('is_sponsored')->default(false);
            $table->boolean('comments_enabled')->default(true);

            // Computed from body length on save, displayed as "5 min read".
            $table->unsignedSmallInteger('reading_minutes')->nullable();

            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            // Autosaved editor state, kept separate from the published body so
            // a draft in progress never overwrites what readers currently see.
            $table->longText('autosave_body')->nullable();
            $table->timestamp('autosaved_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
            $table->index(['author_id', 'status']);
            $table->index('article_category_id');
            $table->index('scheduled_for');
        });

        Schema::create('article_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('visitor_hash', 64)->nullable();
            $table->timestamp('viewed_at')->useCurrent();

            $table->index(['article_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_views');
        Schema::dropIfExists('articles');
    }
};
