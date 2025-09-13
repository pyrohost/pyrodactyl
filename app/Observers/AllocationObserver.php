<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\Allocation;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Illuminate\Support\Facades\Log;

class AllocationObserver
{
    public function __construct(private SubdomainManagementService $subdomainService)
    {
    }

    /**
     * Handle the Allocation "updated" event.
     */
    public function updated(Allocation $allocation): void
    {
        // Check if IP or port changed
        if ($allocation->isDirty(['ip', 'port'])) {
            $this->syncSubdomainForAllocation($allocation);
        }
    }

    /**
     * Handle the Allocation "deleting" event.
     */
    public function deleting(Allocation $allocation): void
    {
        // If this is a primary allocation being deleted, sync subdomains
        if ($allocation->server && $allocation->server->allocation_id === $allocation->id) {
            $this->syncSubdomainForAllocation($allocation);
        }
    }

    /**
     * Sync subdomain DNS records for servers using this allocation.
     */
    private function syncSubdomainForAllocation(Allocation $allocation): void
    {
        if (!$allocation->server) {
            return;
        }

        // Only sync if this is the primary allocation for the server
        if ($allocation->server->allocation_id !== $allocation->id) {
            return;
        }

        $activeSubdomain = $allocation->server->activeSubdomain;
        
        if (!$activeSubdomain) {
            return;
        }

        try {
            $this->subdomainService->updateSubdomain($activeSubdomain);
            Log::info("Updated DNS records for subdomain {$activeSubdomain->full_domain} due to allocation change");
        } catch (\Exception $e) {
            Log::error("Failed to update DNS records for subdomain {$activeSubdomain->full_domain}: {$e->getMessage()}");
        }
    }
}