<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTransferQueueFields extends Migration
{
    public function up(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->enum('queue_status', ['queued', 'active', 'completed', 'failed'])
                ->default('queued')->after('timeout_hours');
            $table->integer('priority')->default(0)->after('queue_status');
            $table->timestamp('queued_at')->nullable()->after('priority');
            $table->timestamp('activated_at')->nullable()->after('queued_at');
        });

        Schema::table('nodes', function (Blueprint $table) {
            $table->integer('max_concurrent_outgoing_transfers')->default(2)->after('maintenance_mode');
            $table->integer('max_concurrent_incoming_transfers')->default(2)->after('max_concurrent_outgoing_transfers');
        });
    }

    public function down(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->dropColumn(['queue_status', 'priority', 'queued_at', 'activated_at']);
        });

        Schema::table('nodes', function (Blueprint $table) {
            $table->dropColumn(['max_concurrent_outgoing_transfers', 'max_concurrent_incoming_transfers']);
        });
    }
}
