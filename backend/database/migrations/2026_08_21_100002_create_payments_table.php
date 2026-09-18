<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * Every payment attempt, successful or not.
         *
         * A failed charge matters as much as a successful one: it is what an
         * employer asks about when their subscription lapses.
         */
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();

            $table->string('stripe_payment_intent_id')->nullable()->unique();
            $table->string('stripe_invoice_id')->nullable()->index();

            $table->unsignedInteger('amount_cents');
            $table->string('currency', 3)->default('USD');

            // succeeded, failed, refunded, pending.
            $table->string('status', 24)->default('pending');

            // Stripe's decline reason, shown to the employer as-is: our own
            // paraphrase would only obscure why the bank refused.
            $table->string('failure_reason')->nullable();

            // The hosted invoice and PDF Stripe generates. Storing the links
            // avoids an API round trip every time the billing page loads.
            $table->string('invoice_url')->nullable();
            $table->string('invoice_pdf_url')->nullable();

            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
