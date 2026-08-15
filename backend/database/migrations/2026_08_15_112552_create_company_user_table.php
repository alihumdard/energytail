<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Built in Phase 1 even though the UI is single-recruiter today.
        // Adding it now costs one table; retrofitting it later would mean
        // rewriting every company authorisation check.
        Schema::create('company_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Role within the company (owner, admin, recruiter) — distinct
            // from the platform-wide role held in spatie's tables.
            $table->string('role', 32)->default('recruiter');
            $table->timestamp('joined_at')->nullable();

            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_user');
    }
};
