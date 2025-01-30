<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_resources', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->float('value');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('discounted_price', 10, 2)->nullable();
            $table->boolean('is_discounted')->default(false);
            $table->boolean('is_hidden')->default(false);
            $table->integer('amount')->default(1);
            $table->integer('limit')->default(-1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_resources');
    }
};