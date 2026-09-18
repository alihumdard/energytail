<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Every Stripe webhook received.
         *
         * Stripe retries a webhook until it gets a 2xx, and can deliver the
         * same event more than once even after success. Recording the event
         * id with a unique constraint is what makes handling idempotent —
         * without it a retried invoice.paid would extend a subscription twice.
         */
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();

            $table->string('provider', 24)->default('stripe');
            $table->string('event_id')->unique();
            $table->string('type', 80)->index();

            $table->json('payload');

            $table->timestamp('processed_at')->nullable();
            // Kept rather than discarded: a handler that threw is the thing
            // worth reading when a subscription is in the wrong state.
            $table->text('error')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
