<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSubusers extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('subusers', function (Blueprint $table) {
      $table->increments('id');
      $table->integer('user_id')->unsigned();
      $table->integer('server_id')->unsigned();
      $table->char('daemonSecret', 36)->unique();
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('subusers');
  }
}
