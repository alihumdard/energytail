<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();

            // Self-referencing for one level of replies.
            $table->foreignId('parent_id')->nullable()
                ->constrained('comments')->cascadeOnDelete();

            // Nullable so guests can comment if the client enables it; the
            // name and email columns cover that case.
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();

            $table->text('body');

            // pending, approved, spam, rejected
            $table->string('status', 20)->default('pending');

            $table->string('ip_address', 45)->nullable();
            $table->unsignedInteger('reports_count')->default(0);

            $table->foreignId('moderated_by')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['article_id', 'status']);
            $table->index('status');
            $table->index('parent_id');
        });

        Schema::create('comment_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('reason', 64);
            $table->text('details')->nullable();
            $table->string('ip_address', 45)->nullable();

            // pending, reviewed, dismissed
            $table->string('status', 20)->default('pending');

            $table->timestamps();

            // One report per user per comment, so a single person cannot
            // inflate the reports_count on a comment they dislike.
            $table->unique(['comment_id', 'user_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_reports');
        Schema::dropIfExists('comments');
    }
};
