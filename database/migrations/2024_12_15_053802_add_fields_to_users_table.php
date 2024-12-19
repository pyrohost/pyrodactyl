<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('discord_id')->nullable();
            $table->string('pterodactyl_id')->nullable();
            $table->string('pterodactyl_email')->nullable();
            $table->integer('coins')->default(0);
            $table->json('resources')->nullable();
            $table->json('limits')->nullable();
            $table->string('rank')->default('user');
            $table->json('purchases_plans')->nullable();
            $table->string('redeem_code')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'discord_id',
                'pterodactyl_id',
                'pterodactyl_email',
                'coins',
                'resources',
                'limits',
                'rank',
                'purchases_plans',
                'redeem_code'
            ]);
        });
    }
};
