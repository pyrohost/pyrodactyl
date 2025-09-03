<?php

namespace Pterodactyl\Listeners\Server;

use Pterodactyl\Events\Server\Updated;
use Pterodactyl\Events\Server\Updating;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Dns\AutoDnsManager;
use Illuminate\Support\Facades\Log;

class ServerDnsListener
{
    private static array $originalAttributes = [];

    public function __construct(
        private AutoDnsManager $autoDnsManager
    ) {}
    /**
     * Handle the server updating event to capture original values.
     */
    public function handleUpdating(Updating $event): void
    {
        $server = $event->server;
        
        // Store original attributes using server ID as key
        self::$originalAttributes[$server->id] = [
            'allocation_id' => $server->getOriginal('allocation_id'),
            'subdomain' => $server->getOriginal('subdomain'),
            'subdomain_type' => $server->getOriginal('subdomain_type'),
            'domain_id' => $server->getOriginal('domain_id'),
        ];

        Log::debug('Captured original server attributes for DNS management', [
            'server_id' => $server->id,
            'original_attributes' => self::$originalAttributes[$server->id],
        ]);
    }

    /**
     * Handle the server updated event to manage DNS records.
     */
    public function handleUpdated(Updated $event): void
    {
        $server = $event->server;
        $serverId = $server->id;

        if (!isset(self::$originalAttributes[$serverId])) {
            Log::warning('No original attributes found for server DNS management', [
                'server_id' => $serverId,
                'available_keys' => array_keys(self::$originalAttributes),
            ]);
            return;
        }

        $original = self::$originalAttributes[$serverId];
        
        try {
            Log::info('Processing server DNS changes', [
                'server_id' => $serverId,
                'original_allocation_id' => $original['allocation_id'],
                'current_allocation_id' => $server->allocation_id,
                'allocation_changed' => $original['allocation_id'] !== $server->allocation_id,
            ]);

            // Handle allocation (IP) changes
            if ($original['allocation_id'] !== $server->allocation_id) {
                Log::info('Allocation change detected, updating DNS records', [
                    'server_id' => $serverId,
                    'old_allocation_id' => $original['allocation_id'],
                    'new_allocation_id' => $server->allocation_id,
                ]);
                $this->handleAllocationChange($server, $original['allocation_id']);
            }

            // Handle subdomain changes
            if ($original['subdomain'] !== $server->subdomain) {
                $this->autoDnsManager->handleSubdomainChange(
                    $server,
                    $original['subdomain'],
                    $server->subdomain
                );
            }

            // Handle game type changes
            if ($original['subdomain_type'] !== $server->subdomain_type) {
                $this->autoDnsManager->handleServerGameChange(
                    $server,
                    $original['subdomain_type'],
                    $server->subdomain_type
                );
            }

            // Handle domain changes
            if ($original['domain_id'] !== $server->domain_id) {
                $this->handleDomainChange($server, $original['domain_id']);
            }

        } catch (\Exception $e) {
            Log::error('Exception in server DNS listener', [
                'server_id' => $serverId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        } finally {
            // Clean up stored attributes
            unset(self::$originalAttributes[$serverId]);
        }
    }

    /**
     * Handle allocation (IP/port) changes.
     */
    private function handleAllocationChange(Server $server, ?int $oldAllocationId): void
    {
        if (!$server->hasSubdomain()) {
            return;
        }

        // Get old IP if allocation changed
        $oldIp = null;
        if ($oldAllocationId) {
            $oldAllocation = \Pterodactyl\Models\Allocation::find($oldAllocationId);
            $oldIp = $oldAllocation?->ip;
        }

        $newIp = $server->allocation?->ip;

        if ($oldIp && $newIp && $oldIp !== $newIp) {
            Log::info('Server allocation changed, updating DNS records', [
                'server_id' => $server->id,
                'old_allocation_id' => $oldAllocationId,
                'new_allocation_id' => $server->allocation_id,
                'old_ip' => $oldIp,
                'new_ip' => $newIp,
            ]);

            $this->autoDnsManager->handleServerIpChange($server, $oldIp, $newIp);
        }
    }

    /**
     * Handle domain changes.
     */
    private function handleDomainChange(Server $server, ?int $oldDomainId): void
    {
        if (!$server->subdomain) {
            return;
        }

        Log::info('Server domain changed, managing DNS records', [
            'server_id' => $server->id,
            'old_domain_id' => $oldDomainId,
            'new_domain_id' => $server->domain_id,
            'subdomain' => $server->subdomain,
        ]);

        // If removing from a domain, delete old DNS records
        if ($oldDomainId && !$server->domain_id) {
            $oldDomain = \Pterodactyl\Models\Domain::find($oldDomainId);
            if ($oldDomain) {
                // Temporarily set the old domain to delete records
                $originalDomainId = $server->domain_id;
                $server->domain_id = $oldDomainId;
                $server->setRelation('domain', $oldDomain);
                
                $this->autoDnsManager->handleSubdomainChange($server, $server->subdomain, null);
                
                // Restore the new domain
                $server->domain_id = $originalDomainId;
                $server->load('domain');
            }
        }

        // If adding to a new domain, create DNS records
        if ($server->domain_id && $server->subdomain_type) {
            $this->autoDnsManager->handleSubdomainChange($server, null, $server->subdomain);
        }
    }

    /**
     * Subscribe to the events.
     */
    public function subscribe($events): void
    {
        $events->listen(
            Updating::class,
            [ServerDnsListener::class, 'handleUpdating']
        );

        $events->listen(
            Updated::class,
            [ServerDnsListener::class, 'handleUpdated']
        );
    }
}