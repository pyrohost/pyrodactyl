<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pastel_keys', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');  // Match users table id type
            $table->string('identifier')->unique();
            $table->text('token');
            $table->text('memo')->nullable();
            $table->json('allowed_ips')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // ACL Permissions
            $table->unsignedInteger('r_users')->default(0);
            $table->unsignedInteger('r_allocations')->default(0);
            $table->unsignedInteger('r_database_hosts')->default(0);
            $table->unsignedInteger('r_server_databases')->default(0);
            $table->unsignedInteger('r_eggs')->default(0);
            $table->unsignedInteger('r_locations')->default(0);
            $table->unsignedInteger('r_nests')->default(0);
            $table->unsignedInteger('r_nodes')->default(0);
            $table->unsignedInteger('r_servers')->default(0);
            
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pastel_keys');
    }
};