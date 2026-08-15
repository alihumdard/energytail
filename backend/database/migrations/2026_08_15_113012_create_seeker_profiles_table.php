<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seeker_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();

            $table->string('headline')->nullable();
            $table->text('summary')->nullable();

            $table->foreignId('country_id')->nullable()
                ->constrained('countries')->nullOnDelete();
            $table->foreignId('city_id')->nullable()
                ->constrained('cities')->nullOnDelete();

            $table->foreignId('job_category_id')->nullable()
                ->constrained('job_categories')->nullOnDelete();
            $table->foreignId('industry_id')->nullable()
                ->constrained('industries')->nullOnDelete();

            $table->unsignedSmallInteger('experience_years')->nullable();
            $table->decimal('expected_salary_min', 12, 2)->nullable();
            $table->decimal('expected_salary_max', 12, 2)->nullable();
            $table->char('expected_salary_currency', 3)->nullable();
            $table->string('salary_period', 16)->nullable();

            $table->string('availability', 32)->nullable();
            $table->boolean('open_to_remote')->default(false);
            $table->boolean('open_to_relocation')->default(false);

            $table->string('website')->nullable();
            $table->string('linkedin_url')->nullable();

            // Kept ready for a candidate-search feature, which is out of the
            // current scope. Private by default so nothing is exposed by
            // accident if that feature is ever switched on.
            $table->string('visibility', 20)->default('private');

            // Recalculated on save and shown on the seeker dashboard.
            $table->unsignedTinyInteger('completeness')->default(0);

            $table->timestamps();

            $table->index('visibility');
            $table->index(['country_id', 'city_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seeker_profiles');
    }
};
