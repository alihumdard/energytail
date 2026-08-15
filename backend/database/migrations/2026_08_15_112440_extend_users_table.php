<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // The register screen collects first and last name separately.
            // Laravel's default single 'name' column is kept as the display
            // name so nothing in the framework breaks.
            $table->string('first_name')->nullable()->after('id');
            $table->string('last_name')->nullable()->after('first_name');

            $table->string('phone', 32)->nullable()->after('email');
            $table->string('avatar_path')->nullable()->after('phone');

            // Account status drives the admin suspend/reactivate action.
            // String rather than enum for MySQL portability.
            $table->string('status', 20)->default('active')->after('avatar_path');
            $table->text('suspended_reason')->nullable()->after('status');
            $table->timestamp('suspended_at')->nullable()->after('suspended_reason');

            $table->string('locale', 8)->default('en')->after('suspended_at');
            $table->string('timezone', 64)->nullable()->after('locale');

            $table->timestamp('last_login_at')->nullable()->after('timezone');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');

            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'first_name', 'last_name', 'phone', 'avatar_path',
                'status', 'suspended_reason', 'suspended_at',
                'locale', 'timezone', 'last_login_at', 'last_login_ip',
            ]);
        });
    }
};
