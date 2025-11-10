<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTokenFieldToServerTransfers extends Migration
{
    public function up(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->text('token')->nullable()->after('activated_at');
        });
    }

    public function down(): void
    {
        Schema::table('server_transfers', function (Blueprint $table) {
            $table->dropColumn('token');
        });
    }
}
