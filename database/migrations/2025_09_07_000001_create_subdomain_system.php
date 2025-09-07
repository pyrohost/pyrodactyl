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
        // Create domains table
        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // example.com
            $table->string('dns_provider'); // cloudflare, route53, etc.
            $table->json('dns_config'); // provider-specific configuration
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->index(['is_active']);
            $table->index(['is_default']);
        });

        // Create server_subdomains table
        Schema::create('server_subdomains', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_id'); // Match servers table increments('id')
            $table->unsignedBigInteger('domain_id'); // Match domains table id()
            $table->string('subdomain'); // myserver
            $table->string('record_type'); // A, SRV, CNAME, etc.
            $table->json('dns_records'); // Array of DNS record IDs from the provider
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->foreign('domain_id')->references('id')->on('domains')->onDelete('cascade');
            
            // Ensure unique subdomain per domain
            $table->unique(['domain_id', 'subdomain']);
            $table->unique(['server_id', 'is_active'], 'server_subdomains_server_active_unique');
            
            $table->index(['server_id']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_subdomains');
        Schema::dropIfExists('domains');
    }
};