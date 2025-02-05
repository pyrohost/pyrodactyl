<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('plans', function (Blueprint $table) {
            // Resource limits
            if (!Schema::hasColumn('plans', 'cpu')) {
                $table->float('cpu')->default(0)->after('price');
            }
            if (!Schema::hasColumn('plans', 'memory')) {
                $table->integer('memory')->default(0)->after('cpu');
            }
            if (!Schema::hasColumn('plans', 'disk')) {
                $table->integer('disk')->default(0)->after('memory');
            }
            if (!Schema::hasColumn('plans', 'servers')) {
                $table->integer('servers')->default(0)->after('disk');
            }
            if (!Schema::hasColumn('plans', 'allocations')) {
                $table->integer('allocations')->default(0)->after('servers');
            }
            if (!Schema::hasColumn('plans', 'backups')) {
                $table->integer('backups')->default(0)->after('allocations');
            }
            if (!Schema::hasColumn('plans', 'databases')) {
                $table->integer('databases')->default(0)->after('backups');
            }
            if (!Schema::hasColumn('plans', 'billing_cycles')) {
                $table->json('billing_cycles')->nullable()->after('databases');
            }
            if (!Schema::hasColumn('plans', 'product_content')) {
                $table->json('product_content')->nullable()->after('billing_cycles');
            }
        });
    }

    public function down()
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'cpu',
                'memory',
                'disk',
                'servers',
                'allocations',
                'backups',
                'databases',
                'billing_cycles',
                'product_content'
            ]);
        });
    }
};