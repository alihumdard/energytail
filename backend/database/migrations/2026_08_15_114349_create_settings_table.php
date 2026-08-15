<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Typed key/value rows grouped to match the admin settings tabs:
        // general, site, email, users, security, seo, storage, payment,
        // notifications, social.
        Schema::create('settings', function (Blueprint $table) {
            $table->id();

            $table->string('group', 32)->default('general');
            $table->string('key')->unique();
            $table->text('value')->nullable();

            // Drives casting on read: string, boolean, integer, json, file.
            $table->string('type', 16)->default('string');

            // Whether the value may be exposed to unauthenticated clients
            // (site name and logo yes, mail credentials no).
            $table->boolean('is_public')->default(false);

            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['group', 'sort_order']);
            $table->index('is_public');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
