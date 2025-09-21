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
        Schema::table('backups', function (Blueprint $table) {
            // Modify the disk column to support rustic adapters
            $table->enum('disk', ['wings', 's3', 'rustic_local', 'rustic_s3'])->default('wings')->change();

            // Add rustic-specific columns
            $table->string('snapshot_id', 64)->nullable()->after('checksum')->comment('Rustic snapshot ID for rustic backups');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            // Revert disk column to original enum values
            $table->enum('disk', ['wings', 's3'])->default('wings')->change();

            // Drop rustic-specific columns
            $table->dropColumn('snapshot_id');
        });

    }
};