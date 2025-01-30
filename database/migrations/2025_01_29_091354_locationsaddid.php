<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LocationsAddId extends Migration
{
    public function up()
    {
        Schema::table('servers', function (Blueprint $table) {
            if (!Schema::hasColumn('servers', 'node_id')) {
                $table->foreignId('node_id')->constrained()->onDelete('cascade');
            }
        });
        
        Schema::table('nodes', function (Blueprint $table) {
            if (!Schema::hasColumn('nodes', 'location_id')) {
                $table->foreignId('location_id')->constrained()->onDelete('cascade');
            }
        });
    }

    public function down()
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['node_id']);
            $table->dropColumn('node_id');
        });
        
        Schema::table('nodes', function (Blueprint $table) {
            $table->dropForeign(['location_id']);
            $table->dropColumn('location_id');
        });
    }
}