<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('elytra_jobs', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->unsignedInteger('server_id');
            $table->unsignedInteger('user_id');

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->string('job_type'); // backup_create, backup_delete, etc.
            $table->json('job_data'); // Operation-specific data
            $table->string('status')->default('pending'); // pending, submitted, running, completed, failed, cancelled
            $table->integer('progress')->default(0); // 0-100
            $table->text('status_message')->nullable();
            $table->text('error_message')->nullable();
            $table->string('elytra_job_id')->nullable(); // Job ID from Elytra daemon

            $table->timestampTz('created_at');
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampTz('updated_at');

            $table->index(['server_id', 'status']);
            $table->index(['server_id', 'job_type']);
            $table->index(['elytra_job_id']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('elytra_jobs');
    }
};
