<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('dns_provider')->default('cloudflare');
            $table->json('dns_config');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->json('sync_status')->nullable();
            $table->timestamps();

            $table->index(['is_active']);
        });

        Schema::table('servers', function (Blueprint $table) {
            $table->string('subdomain')->nullable()->after('name');
            $table->string('subdomain_type')->nullable()->after('subdomain');
            $table->unsignedBigInteger('domain_id')->nullable()->after('subdomain_type');
            
            $table->foreign('domain_id')->references('id')->on('domains')->onDelete('set null');
            $table->unique(['subdomain', 'domain_id'], 'servers_subdomain_domain_unique');
            $table->index(['subdomain']);
            $table->index(['subdomain_type']);
            $table->index(['domain_id']);
        });

        DB::table('servers')
            ->whereNull('subdomain')
            ->update(['subdomain_type' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['domain_id']);
            $table->dropUnique('servers_subdomain_domain_unique');
            $table->dropIndex(['subdomain']);
            $table->dropIndex(['subdomain_type']);
            $table->dropIndex(['domain_id']);
            $table->dropColumn(['subdomain', 'subdomain_type', 'domain_id']);
        });

        Schema::dropIfExists('domains');
    }
};