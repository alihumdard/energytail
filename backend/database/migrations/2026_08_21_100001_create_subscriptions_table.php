<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * A company's subscription to a plan.
         *
         * Held against the company rather than the user: an employer's
         * colleagues post under the same company, and the entitlement belongs
         * to the business, not the individual who happened to pay.
         */
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            // Who bought it, for the audit trail.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('stripe_subscription_id')->nullable()->unique();
            $table->string('stripe_customer_id')->nullable()->index();

            /*
             * Mirrors Stripe's own status vocabulary rather than inventing a
             * parallel one — a webhook can then set it without translation,
             * and a mismatch between the two systems is visible.
             */
            $table->string('status', 24)->default('incomplete');

            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            // Set when the employer cancels but the period is still running.
            $table->timestamp('cancels_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            /*
             * Postings used this period, counted here rather than by querying
             * jobs. A job deleted after posting still consumed its slot, and
             * counting live rows would hand back the allowance.
             */
            $table->unsignedInteger('jobs_used')->default(0);
            $table->unsignedInteger('featured_used')->default(0);

            $table->timestamps();

            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
