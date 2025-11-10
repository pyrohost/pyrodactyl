<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTransferTimeoutAndHeartbeatFields extends Migration
{
    public function up(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('archived');
            $table->timestamp('last_heartbeat_at')->nullable()->after('started_at');
            $table->integer('timeout_hours')->default(6)->after('last_heartbeat_at');
        });
    }

    public function down(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'last_heartbeat_at', 'timeout_hours']);
        });
    }
}
