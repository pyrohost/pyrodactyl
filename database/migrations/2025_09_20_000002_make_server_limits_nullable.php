<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->unsignedInteger('database_limit')->nullable()->change();
            $table->unsignedInteger('allocation_limit')->nullable()->change();
            $table->unsignedInteger('backup_limit')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->unsignedInteger('database_limit')->default(0)->change();
            $table->unsignedInteger('allocation_limit')->default(0)->change();
            $table->unsignedInteger('backup_limit')->default(0)->change();
        });
    }
};