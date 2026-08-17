<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            // The audit log screen filters on all of these. They are stored as
            // columns rather than dug out of the JSON properties blob, so the
            // filters are indexable rather than requiring a full scan.
            $table->string('module', 64)->nullable()->after('log_name');
            $table->string('action', 32)->nullable()->after('module');

            // Snapshot of the actor at the time of the event. Kept even if the
            // user is later deleted or their role changes — an audit trail that
            // rewrites itself when a role changes is not an audit trail.
            $table->string('actor_name')->nullable()->after('causer_id');
            $table->string('actor_role', 64)->nullable()->after('actor_name');

            $table->string('ip_address', 45)->nullable()->after('actor_role');
            $table->string('user_agent')->nullable()->after('ip_address');

            // success, pending, failed
            $table->string('status', 20)->default('success')->after('user_agent');

            $table->index(['module', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index('actor_role');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropIndex(['module', 'created_at']);
            $table->dropIndex(['action', 'created_at']);
            $table->dropIndex(['actor_role']);
            $table->dropIndex(['status']);

            $table->dropColumn([
                'module', 'action', 'actor_name', 'actor_role',
                'ip_address', 'user_agent', 'status',
            ]);
        });
    }
};
