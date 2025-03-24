<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

class AddNullableFieldLastrun extends Migration
{
  /**
   * Run the migrations.
   */
  public function up()
  {
    $table = DB::getQueryGrammar()->wrapTable('tasks');

    if (DB::getDriverName() === 'pgsql') {
      // PostgreSQL-specific syntax
      DB::statement('ALTER TABLE ' . $table . ' ALTER COLUMN last_run DROP NOT NULL;');
    } else {
      // MySQL/MariaDB-specific syntax
      DB::statement('ALTER TABLE ' . $table . ' CHANGE `last_run` `last_run` TIMESTAMP NULL;');
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down()
  {
    $table = DB::getQueryGrammar()->wrapTable('tasks');

    if (DB::getDriverName() === 'pgsql') {
      // PostgreSQL-specific syntax
      DB::statement('ALTER TABLE ' . $table . ' ALTER COLUMN last_run SET NOT NULL;');
    } else {
      // MySQL/MariaDB-specific syntax
      DB::statement('ALTER TABLE ' . $table . ' CHANGE `last_run` `last_run` TIMESTAMP;');
    }
  }
}
