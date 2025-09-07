<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerSubdomain;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Pterodactyl\Services\Subdomain\SubdomainGeneratorService;
use Illuminate\Support\Facades\Log;

class ServerObserver
{
    public function __construct(
        private SubdomainManagementService $subdomainService,
        private SubdomainGeneratorService $subdomainGenerator
    ) {
    }

    /**
     * Handle the Server "created" event.
     */
    public function created(Server $server): void
    {
        // Check if server supports subdomains
        $feature = $this->subdomainService->getServerSubdomainFeature($server);
        if (!$feature) {
            Log::info("Server {$server->id} does not support subdomains. Features: " . json_encode($server->egg->features));
            return;
        }

        // Get default domain
        $domain = Domain::getDefault();
        if (!$domain) {
            Log::warning("No default domain available for subdomain creation. Please set a default domain in the admin panel.");
            return;
        }

        if (!$domain->is_active) {
            Log::warning("Default domain {$domain->name} is not active");
            return;
        }

        // Get existing subdomains for uniqueness check
        $existingSubdomains = ServerSubdomain::where('domain_id', $domain->id)
            ->where('is_active', true)
            ->pluck('subdomain')
            ->toArray();

        // Generate unique subdomain
        $subdomain = $this->subdomainGenerator->generateUnique($existingSubdomains);

        try {
            $this->subdomainService->createSubdomain($server, $domain, $subdomain);
            Log::info("Created subdomain {$subdomain}.{$domain->name} for new server {$server->id}");
        } catch (\Exception $e) {
            Log::error("Failed to create subdomain for server {$server->id}: {$e->getMessage()}");
        }
    }

    /**
     * Handle the Server "updated" event.
     */
    public function updated(Server $server): void
    {
        // Check if allocation_id changed (primary allocation changed)
        if ($server->isDirty('allocation_id')) {
            $this->syncSubdomainRecords($server);
        }

        // Check if egg_id changed (server software changed)
        if ($server->isDirty('egg_id')) {
            $this->handleServerSoftwareChange($server);
        }
    }

    /**
     * Handle the Server "deleting" event.
     */
    public function deleting(Server $server): void
    {
        // Delete all subdomains when server is deleted
        $subdomains = $server->subdomains()->where('is_active', true)->get();
        
        foreach ($subdomains as $subdomain) {
            try {
                $this->subdomainService->deleteSubdomain($subdomain);
            } catch (\Exception $e) {
                Log::warning("Failed to delete subdomain {$subdomain->full_domain} for server {$server->id}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Sync subdomain DNS records when server allocation changes.
     */
    private function syncSubdomainRecords(Server $server): void
    {
        $activeSubdomain = $server->activeSubdomain;
        
        if (!$activeSubdomain) {
            return;
        }

        try {
            $this->subdomainService->updateSubdomain($activeSubdomain);
            Log::info("Updated DNS records for subdomain {$activeSubdomain->full_domain} due to server allocation change");
        } catch (\Exception $e) {
            Log::error("Failed to update DNS records for subdomain {$activeSubdomain->full_domain}: {$e->getMessage()}");
        }
    }

    /**
     * Handle server software changes.
     */
    private function handleServerSoftwareChange(Server $server): void
    {
        $activeSubdomain = $server->activeSubdomain;
        
        if (!$activeSubdomain) {
            return;
        }

        // Check if the new egg supports subdomains
        $feature = $this->subdomainService->getServerSubdomainFeature($server);
        
        if (!$feature) {
            // New software doesn't support subdomains, delete the subdomain
            try {
                $this->subdomainService->deleteSubdomain($activeSubdomain);
                Log::info("Deleted subdomain {$activeSubdomain->full_domain} because new server software doesn't support subdomains");
            } catch (\Exception $e) {
                Log::error("Failed to delete subdomain {$activeSubdomain->full_domain} after software change: {$e->getMessage()}");
            }
        } else {
            // New software supports subdomains, check if record type changed
            $newRecordType = str_replace('subdomain_', '', $feature->getFeatureName());
            if ($newRecordType !== $activeSubdomain->record_type) {
                try {
                    // Delete old records and create new ones
                    $this->subdomainService->deleteSubdomain($activeSubdomain);
                    $this->subdomainService->createSubdomain(
                        $server,
                        $activeSubdomain->domain,
                        $activeSubdomain->subdomain
                    );
                    Log::info("Recreated subdomain {$activeSubdomain->full_domain} with new record type due to software change");
                } catch (\Exception $e) {
                    Log::error("Failed to recreate subdomain {$activeSubdomain->full_domain} after software change: {$e->getMessage()}");
                }
            } else {
                // Same record type, just update records
                try {
                    $this->subdomainService->updateSubdomain($activeSubdomain);
                    Log::info("Updated DNS records for subdomain {$activeSubdomain->full_domain} due to server software change");
                } catch (\Exception $e) {
                    Log::error("Failed to update DNS records for subdomain {$activeSubdomain->full_domain}: {$e->getMessage()}");
                }
            }
        }
    }
}
