<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddUniqueActiveTransferConstraint extends Migration
{
    public function up(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->string('active_key', 36)->nullable()->after('server_id')
                ->storedAs('CASE WHEN successful IS NULL THEN CAST(server_id AS CHAR) ELSE NULL END');

            $table->unique('active_key', 'idx_unique_active_transfer');
        });
    }

    public function down(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->dropUnique('idx_unique_active_transfer');
            $table->dropColumn('active_key');
        });
    }
}
