<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Human-readable label for the admin UI. Spatie's 'name' column
            // stays the machine key (job_seeker), so renaming a role for
            // display never breaks a permission check.
            $table->string('label')->nullable()->after('name');
            $table->text('description')->nullable()->after('label');

            // System roles are seeded and cannot be deleted from the admin
            // panel — removing Administrator would lock everyone out.
            $table->boolean('is_system')->default(false)->after('description');

            $table->unsignedInteger('sort_order')->default(0)->after('is_system');
        });

        Schema::table('permissions', function (Blueprint $table) {
            // Lets the matrix screen group permissions into module rows
            // without parsing the "module.action" name string.
            $table->string('module', 64)->nullable()->after('name');
            $table->string('action', 32)->nullable()->after('module');
            $table->string('label')->nullable()->after('action');

            $table->index('module');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropIndex(['module']);
            $table->dropColumn(['module', 'action', 'label']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['label', 'description', 'is_system', 'sort_order']);
        });
    }
};
