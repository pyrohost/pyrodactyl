<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('console_logs', function (Blueprint $table) {
            $table->id();
            $table->string('server_uuid');
            $table->text('content');
            $table->timestamp('timestamp');
            $table->timestamps();
            
            $table->index('server_uuid');
        });
    }

    public function down()
    {
        Schema::dropIfExists('console_logs');
    }
};