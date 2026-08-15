<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();

            // Primary owner. Additional recruiters attach through company_user.
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('slug')->unique();
            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('website')->nullable();

            $table->foreignId('industry_id')->nullable()
                ->constrained('industries')->nullOnDelete();
            $table->foreignId('country_id')->nullable()
                ->constrained('countries')->nullOnDelete();
            $table->foreignId('city_id')->nullable()
                ->constrained('cities')->nullOnDelete();
            $table->string('address')->nullable();

            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('cover_path')->nullable();

            // Free text ("201 - 500 employees") to match the design, plus a
            // numeric floor so size ranges remain sortable and filterable.
            $table->string('company_size', 50)->nullable();
            $table->unsignedInteger('size_min')->nullable();
            $table->unsignedSmallInteger('founded_year')->nullable();

            // Admin moderation: pending, active, suspended, inactive.
            $table->string('status', 20)->default('pending');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('verified_at')->nullable();

            // Denormalised counter for the company directory, which would
            // otherwise COUNT open jobs for every card on every page.
            $table->unsignedInteger('jobs_count')->default(0);

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'is_featured']);
            $table->index('country_id');
            $table->index('industry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
