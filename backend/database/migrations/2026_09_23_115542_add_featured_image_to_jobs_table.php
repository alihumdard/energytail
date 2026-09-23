<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gives a job listing its own image.
 *
 * Job cards and the detail banner have been showing a photograph chosen
 * from the job's category — every drilling role looking like every other
 * drilling role — because there was nowhere to put one of the job's own.
 *
 * Nullable and with no default: every existing listing keeps working and
 * keeps falling back to the category photo, so this can ship before any
 * employer has uploaded anything.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            // Mirrors articles.featured_image_path, which stores a path on
            // the public disk rather than a URL — the host can change
            // without rewriting every row.
            $table->string('featured_image_path')->nullable()->after('benefits');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn('featured_image_path');
        });
    }
};
