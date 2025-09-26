<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddAsyncBackupJobsSupport extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('backups', function (Blueprint $table) {
            // Add async job tracking fields
            $table->string('job_id')->nullable()->after('uuid')->index()->comment('Elytra job ID for async operations');
            $table->enum('job_status', ['pending', 'running', 'completed', 'failed', 'cancelled'])
                ->default('pending')
                ->after('job_id')
                ->comment('Current status of the backup job');
            $table->tinyInteger('job_progress')->default(0)->after('job_status')->comment('Job progress percentage (0-100)');
            $table->text('job_message')->nullable()->after('job_progress')->comment('Current job status message');
            $table->text('job_error')->nullable()->after('job_message')->comment('Error message if job failed');
            $table->timestamp('job_started_at')->nullable()->after('job_error')->comment('When the job started processing');
            $table->timestamp('job_last_updated_at')->nullable()->after('job_started_at')->comment('Last job status update');

            // Add indexes for efficient querying
            $table->index(['server_id', 'job_status'], 'backups_server_job_status_index');
            $table->index(['job_status', 'job_last_updated_at'], 'backups_job_status_updated_index');
        });

        // Create backup job queue table for tracking operations that need retry/cleanup
        Schema::create('backup_job_queue', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique()->comment('Elytra job ID');
            $table->unsignedBigInteger('backup_id')->index()->comment('Associated backup record');
            $table->enum('operation_type', ['create', 'delete', 'restore'])->comment('Type of backup operation');
            $table->enum('status', ['queued', 'processing', 'completed', 'failed', 'cancelled', 'retry'])->default('queued');
            $table->json('job_data')->nullable()->comment('Original job request data');
            $table->text('error_message')->nullable()->comment('Error details if failed');
            $table->tinyInteger('retry_count')->default(0)->comment('Number of retry attempts');
            $table->timestamp('last_polled_at')->nullable()->comment('Last time job status was checked');
            $table->timestamp('expires_at')->nullable()->comment('When to stop polling for this job');
            $table->timestamps();

            $table->foreign('backup_id')->references('id')->on('backups')->onDelete('cascade');
            $table->index(['status', 'last_polled_at'], 'job_queue_status_polled_index');
            $table->index(['expires_at'], 'job_queue_expires_index');
        });

        // Update existing backups to have default job status
        DB::table('backups')->update([
            'job_status' => DB::raw('CASE
                WHEN is_successful = 1 AND completed_at IS NOT NULL THEN "completed"
                WHEN is_successful = 0 AND completed_at IS NOT NULL THEN "failed"
                ELSE "completed"
            END'),
            'job_progress' => DB::raw('CASE
                WHEN is_successful = 1 AND completed_at IS NOT NULL THEN 100
                WHEN is_successful = 0 AND completed_at IS NOT NULL THEN 0
                ELSE 100
            END'),
            'job_last_updated_at' => DB::raw('COALESCE(completed_at, updated_at)')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_job_queue');

        Schema::table('backups', function (Blueprint $table) {
            $table->dropIndex('backups_server_job_status_index');
            $table->dropIndex('backups_job_status_updated_index');
            $table->dropColumn([
                'job_id',
                'job_status',
                'job_progress',
                'job_message',
                'job_error',
                'job_started_at',
                'job_last_updated_at'
            ]);
        });
    }
}