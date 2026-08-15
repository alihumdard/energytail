<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Created in Phase 1 because the Phase 2 homepage has a signup form,
        // while double opt-in and list management arrive in Phase 3.
        // See conflict C4. Until then rows are stored unconfirmed.
        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();

            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            // pending, confirmed, unsubscribed, bounced
            $table->string('status', 20)->default('pending');

            // Single-use token for the confirmation link.
            $table->string('confirmation_token', 64)->nullable()->unique();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();

            // Where the signup came from, for attribution.
            $table->string('source', 64)->nullable();
            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }
};
