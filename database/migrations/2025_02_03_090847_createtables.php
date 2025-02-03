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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->double('price');
            //$table->json('transferrableTo')->nullable();
            $table->string('image')->nullable();
            $table->json('billingCycles')->nullable();
            $table->boolean('renewable')->default(false);
            $table->string('platform')->nullable();
            $table->json('productContent')->nullable(); // keys: coins, memory, disk, cpu, databases, allocations, servers, backups
            $table->boolean('invisible')->default(false);
            $table->integer('amountAllowedPerCustomer')->default(0);
            $table->integer('purchases')->default(0);
            $table->boolean('recurrentResources')->default(false);
            $table->json('limits')->nullable(); // keys: cpu, memory, disk, swap, io, threads, allocations, databases, backups
            $table->double('strikeThroughPrice')->nullable();
            $table->string('redir')->nullable();
            $table->text('upperdesc')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('plans');
    }
};
