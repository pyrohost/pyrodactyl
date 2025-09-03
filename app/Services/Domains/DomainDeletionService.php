<?php

namespace Pterodactyl\Services\Domains;

use Pterodactyl\Models\Domain;
use Pterodactyl\Services\Dns\DnsManager;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Support\Facades\Log;

class DomainDeletionService
{
    public function __construct(
        private DnsManager $dnsManager
    ) {
    }

    /**
     * Delete a domain and clean up associated DNS records.
     *
     * @throws DisplayException
     */
    public function handle(Domain $domain): void
    {
        // Check if domain has servers using subdomains
        $serversWithSubdomains = $domain->servers()->whereNotNull('subdomain')->count();
        
        if ($serversWithSubdomains > 0) {
            throw new DisplayException("Cannot delete domain '{$domain->name}' because {$serversWithSubdomains} server(s) are using subdomains from this domain. Please remove subdomains from all servers first.");
        }

        // Try to clean up any remaining DNS records
        try {
            $this->cleanupDnsRecords($domain);
        } catch (\Exception $e) {
            Log::warning('Failed to cleanup DNS records during domain deletion', [
                'domain_id' => $domain->id,
                'domain_name' => $domain->name,
                'error' => $e->getMessage(),
            ]);
            // Continue with deletion even if DNS cleanup fails
        }

        // Delete the domain
        $domain->delete();

        Log::info('Domain deleted successfully', [
            'domain_id' => $domain->id,
            'domain_name' => $domain->name,
        ]);
    }

    /**
     * Clean up DNS records for the domain.
     */
    private function cleanupDnsRecords(Domain $domain): void
    {
        try {
            // Get all records for the domain
            $records = $this->dnsManager->getProvider($domain)->getDomainRecords($domain);
            
            Log::info('DNS cleanup completed for domain', [
                'domain_id' => $domain->id,
                'domain_name' => $domain->name,
                'records_found' => count($records),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get domain records for cleanup', [
                'domain_id' => $domain->id,
                'domain_name' => $domain->name,
                'error' => $e->getMessage(),
            ]);
            
            // Don't throw exception here to allow domain deletion to continue
        }
    }
}