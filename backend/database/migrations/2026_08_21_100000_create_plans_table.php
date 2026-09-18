<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * What an employer can buy.
         *
         * Prices are stored in minor units (cents) as integers. Floats cannot
         * represent 19.99 exactly, and a rounding error in a billing system
         * is money quietly appearing or disappearing.
         */
        Schema::create('plans', function (Blueprint $table) {
            $table->id();

            $table->string('name', 80);
            $table->string('slug', 80)->unique();
            $table->text('description')->nullable();

            // Stripe's identifiers. Nullable so plans can be defined and
            // reviewed before the Stripe account exists.
            $table->string('stripe_product_id')->nullable();
            $table->string('stripe_price_id')->nullable()->index();

            $table->unsignedInteger('price_cents')->default(0);
            $table->string('currency', 3)->default('USD');

            // 'month' or 'year'. A free tier uses price_cents = 0.
            $table->string('interval', 8)->default('month');

            /*
             * What the plan actually grants.
             *
             * job_limit is per billing period; null means unlimited, which is
             * different from 0 (a plan that grants no postings at all).
             */
            $table->unsignedInteger('job_limit')->nullable();
            $table->unsignedInteger('featured_job_limit')->default(0);
            $table->unsignedInteger('job_duration_days')->default(30);

            $table->boolean('is_active')->default(true);
            // The one highlighted on the pricing page.
            $table->boolean('is_popular')->default(false);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
