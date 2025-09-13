<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('nodes', function (Blueprint $table) {
      $table->string('internal_fqdn')->nullable()->after('fqdn');
      $table->boolean('use_separate_fqdns')->default(false)->after('internal_fqdn');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('nodes', function (Blueprint $table) {
      $table->dropColumn(['internal_fqdn', 'use_separate_fqdns']);
    });
  }
};
