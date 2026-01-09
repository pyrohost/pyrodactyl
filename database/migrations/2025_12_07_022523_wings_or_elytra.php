<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table("nodes", function (Blueprint $table) {
            $table->enum('daemonType', ['wings', 'elytra'])->default("elytra")->comment("What daemon Type this node uses");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("nodes", function (Blueprint $table) {
            $table->dropColumn('daemonType');
        });
    }
};
