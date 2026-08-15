<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // Free-text grouping shown on the admin skills screen
            // ("Programming Languages", "Cloud Computing"). Deliberately not
            // a foreign key — the client curates these ad hoc.
            $table->string('category')->nullable();

            $table->string('icon', 16)->nullable();
            $table->char('color', 7)->nullable();

            // Editorial flag used to highlight in-demand skills in the UI.
            // Stored as a string rather than an enum to keep MySQL portability.
            $table->string('demand_level', 20)->default('medium');

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
