<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AllowServerVariablesToHaveLongerValues extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('server_variables', function (Blueprint $table) {
      $table->text('variable_value')->change();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('server_variables', function (Blueprint $table) {
      $table->string('variable_value')->change();
    });
  }
}
