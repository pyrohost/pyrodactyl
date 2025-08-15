<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to create server operations tracking table.
 *
 * Creates table for tracking long-running server operations like egg changes,
 * reinstalls, and backup restores with proper indexing for performance.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('server_operations', function (Blueprint $table) {
            $table->id();
            $table->string('operation_id', 36)->unique();
            $table->unsignedInteger('server_id');
            $table->unsignedInteger('user_id');
            $table->string('type', 50);
            $table->string('status', 20)->default('pending');
            $table->text('message')->nullable();
            $table->json('parameters')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->index(['server_id', 'status', 'created_at'], 'server_operations_server_status_created');
            $table->index(['type', 'status', 'created_at'], 'server_operations_type_status_created');
            $table->index(['status', 'created_at'], 'server_operations_status_created');
            $table->index(['server_id', 'status'], 'server_operations_server_status');
            $table->index(['status', 'started_at'], 'server_operations_status_started');
            $table->index(['user_id', 'type', 'created_at'], 'server_operations_user_type_created');
            $table->index(['operation_id', 'server_id'], 'server_operations_operation_server');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_operations');
    }
};