<?php

use Illuminate\Support\Facades\DB;
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
        switch (DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME)) {
            case 'mysql':
                Schema::table('backups', function (Blueprint $table) {
                    // Modify the disk column to support rustic adapters
                    $table->enum('disk', ['wings', 's3', 'rustic_local', 'rustic_s3'])
                        ->default('wings')
                        ->change();

                    // Add rustic-specific columns
                    $table->string('snapshot_id', 64)
                        ->nullable()
                        ->after('checksum')
                        ->comment('Rustic snapshot ID for rustic backups');
                });
                break;

            case 'pgsql':
                Schema::table('backups', function (Blueprint $table) {
                    // Use string + enforce values via CHECK constraint
                    $table->string('disk')->default('wings')->change();

                    // Add the check constraint
                    DB::statement("
                        ALTER TABLE backups
                        ADD CONSTRAINT backups_disk_check
                        CHECK (disk IN ('wings', 's3', 'rustic_local', 'rustic_s3'))
                    ");

                    // Add rustic-specific column
                    $table->string('snapshot_id', 64)
                        ->nullable()
                        ->after('checksum')
                        ->comment('Rustic snapshot ID for rustic backups');
                });
                break;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        switch (DB::connection()->getPdo()->getAttribute(PDO::ATTR_DRIVER_NAME)) {
            case 'mysql':
                Schema::table('backups', function (Blueprint $table) {
                    // Revert disk column to original enum values
                    $table->enum('disk', ['wings', 's3'])->default('wings')->change();
                    // Drop rustic-specific columns
                    $table->dropColumn('snapshot_id');
                });
                break;

            case 'pgsql':
                Schema::table('backups', function (Blueprint $table) {
                    // Drop the check constraint first
                    DB::statement("ALTER TABLE backups DROP CONSTRAINT backups_disk_check");

                    // Revert disk to string with original allowed values
                    $table->string('disk')->default('wings')->change();

                    // Re-add original constraint
                    DB::statement("
                        ALTER TABLE backups
                        ADD CONSTRAINT IF NOT EXISTS backups_disk_check
                        CHECK (disk IN ('wings', 's3'))
                    ");

                    // Drop rustic-specific column
                    $table->dropColumn('snapshot_id');
                });
                break;
        }
    }
};
