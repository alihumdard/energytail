<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // ISO 3166-1: alpha-2 drives flag emoji and locale lookups,
            // alpha-3 and numeric are kept for third-party integrations.
            $table->char('code', 2)->unique();
            $table->char('code_alpha3', 3)->nullable()->unique();
            $table->string('phone_code', 8)->nullable();
            $table->string('currency_code', 3)->nullable();

            $table->string('region')->nullable();
            $table->string('flag_emoji', 16)->nullable();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Public listings filter on is_active and order by sort_order.
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
