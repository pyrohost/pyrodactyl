<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('locations', 'flag_url')) {
            Schema::table('locations', function (Blueprint $table) {
                $table->string('flag_url')->nullable()->after('long');
                $table->integer('maximum_servers')->default(0)->after('flag_url');
                $table->json('required_plans')->nullable()->after('maximum_servers');
                $table->integer('required_rank')->default(0)->after('required_plans');
            });
        }
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['flag_url', 'maximum_servers', 'required_plans', 'required_rank']);
        });
    }
};