<?php
// omg, first migration of 2026
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
            $table->string('backupDisk')->default("rustic_local")->comment("What Backup type this Node uses");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("nodes", function (Blueprint $table) {
            $table->dropColumn('backupDisk');
        });
    }
};
