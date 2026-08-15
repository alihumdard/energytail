<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A row per social link rather than fixed columns, so adding a
        // platform is data entry rather than a migration.
        Schema::create('company_socials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();

            $table->string('platform', 32);
            $table->string('url');
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->unique(['company_id', 'platform']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_socials');
    }
};
