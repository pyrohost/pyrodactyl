<?php

namespace Pterodactyl\Services\Dns;

use Exception;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Games\GameRegistry;
use Illuminate\Support\Facades\Log;

class AutoDnsManager
{
    public function __construct(
        private DnsManager $dnsManager,
        private GameRegistry $gameRegistry
    ) {}

    /**
     * Handle server IP change by updating DNS records.
     */
    public function handleServerIpChange(Server $server, string $oldIp, string $newIp): bool
    {
        if (!$server->hasSubdomain()) {
            return true; // No subdomain to update
        }

        Log::info('Handling server IP change for DNS records', [
            'server_id' => $server->id,
            'subdomain' => $server->subdomain,
            'domain' => $server->domain->name ?? 'unknown',
            'old_ip' => $oldIp,
            'new_ip' => $newIp,
        ]);

        try {
            // Update DNS records with new IP
            $result = $this->dnsManager->updateSubdomainRecords($server);
            
            if ($result) {
                Log::info('Successfully updated DNS records for IP change', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'new_ip' => $newIp,
                ]);
            } else {
                Log::error('Failed to update DNS records for IP change', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'old_ip' => $oldIp,
                    'new_ip' => $newIp,
                ]);
            }

            return $result;
        } catch (Exception $e) {
            Log::error('Exception during DNS record update for IP change', [
                'server_id' => $server->id,
                'subdomain' => $server->subdomain,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Handle server game type change by updating or deleting DNS records.
     */
    public function handleServerGameChange(Server $server, ?string $oldGameType, ?string $newGameType): bool
    {
        if (!$server->hasSubdomain()) {
            return true; // No subdomain to manage
        }

        Log::info('Handling server game type change for DNS records', [
            'server_id' => $server->id,
            'subdomain' => $server->subdomain,
            'domain' => $server->domain->name ?? 'unknown',
            'old_game_type' => $oldGameType,
            'new_game_type' => $newGameType,
        ]);

        try {
            // If changing to a game that doesn't support subdomains, delete DNS records
            if ($newGameType && !$this->gameSupportsSubdomains($newGameType)) {
                Log::info('New game type does not support subdomains, deleting DNS records', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'new_game_type' => $newGameType,
                ]);
                
                return $this->dnsManager->deleteSubdomainRecords($server);
            }

            // If changing from a non-supporting game to a supporting game, create DNS records
            if ($oldGameType && !$this->gameSupportsSubdomains($oldGameType) && 
                $newGameType && $this->gameSupportsSubdomains($newGameType)) {
                Log::info('New game type supports subdomains, creating DNS records', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'new_game_type' => $newGameType,
                ]);
                
                return $this->dnsManager->createSubdomainRecords($server);
            }

            // If both games support subdomains, update the records
            if ($newGameType && $this->gameSupportsSubdomains($newGameType)) {
                Log::info('Updating DNS records for game type change', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'new_game_type' => $newGameType,
                ]);
                
                return $this->dnsManager->updateSubdomainRecords($server);
            }

            return true;
        } catch (Exception $e) {
            Log::error('Exception during DNS record management for game change', [
                'server_id' => $server->id,
                'subdomain' => $server->subdomain,
                'old_game_type' => $oldGameType,
                'new_game_type' => $newGameType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Handle subdomain assignment/removal.
     */
    public function handleSubdomainChange(Server $server, ?string $oldSubdomain, ?string $newSubdomain): bool
    {
        Log::info('Handling subdomain change for DNS records', [
            'server_id' => $server->id,
            'old_subdomain' => $oldSubdomain,
            'new_subdomain' => $newSubdomain,
            'domain' => $server->domain->name ?? 'unknown',
            'game_type' => $server->subdomain_type,
        ]);

        try {
            // If removing subdomain, delete DNS records
            if ($oldSubdomain && !$newSubdomain) {
                Log::info('Removing subdomain, deleting DNS records', [
                    'server_id' => $server->id,
                    'old_subdomain' => $oldSubdomain,
                ]);
                
                // Temporarily set the subdomain back to delete the records
                $server->subdomain = $oldSubdomain;
                $result = $this->dnsManager->deleteSubdomainRecords($server);
                $server->subdomain = $newSubdomain;
                
                return $result;
            }

            // If adding subdomain, create DNS records
            if (!$oldSubdomain && $newSubdomain) {
                Log::info('Adding subdomain, creating DNS records', [
                    'server_id' => $server->id,
                    'new_subdomain' => $newSubdomain,
                    'game_type' => $server->subdomain_type,
                ]);
                
                // Only create if game supports subdomains
                if ($server->subdomain_type && $this->gameSupportsSubdomains($server->subdomain_type)) {
                    return $this->dnsManager->createSubdomainRecords($server);
                }
                
                return true;
            }

            // If changing subdomain, update DNS records
            if ($oldSubdomain && $newSubdomain && $oldSubdomain !== $newSubdomain) {
                Log::info('Changing subdomain, updating DNS records', [
                    'server_id' => $server->id,
                    'old_subdomain' => $oldSubdomain,
                    'new_subdomain' => $newSubdomain,
                ]);
                
                // Delete old records first
                $server->subdomain = $oldSubdomain;
                $this->dnsManager->deleteSubdomainRecords($server);
                
                // Create new records
                $server->subdomain = $newSubdomain;
                if ($server->subdomain_type && $this->gameSupportsSubdomains($server->subdomain_type)) {
                    return $this->dnsManager->createSubdomainRecords($server);
                }
                
                return true;
            }

            return true;
        } catch (Exception $e) {
            Log::error('Exception during DNS record management for subdomain change', [
                'server_id' => $server->id,
                'old_subdomain' => $oldSubdomain,
                'new_subdomain' => $newSubdomain,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Check if a game type supports subdomains.
     */
    private function gameSupportsSubdomains(string $gameType): bool
    {
        $preset = $this->gameRegistry->get($gameType);
        
        if (!$preset) {
            Log::warning('Unknown game type, assuming no subdomain support', [
                'game_type' => $gameType,
            ]);
            return false;
        }

        return $preset->supportsSubdomains();
    }

    /**
     * Sync all DNS records for servers with subdomains.
     */
    public function syncAllServerDnsRecords(): int
    {
        $servers = Server::whereNotNull('subdomain')
            ->whereNotNull('domain_id')
            ->whereNotNull('subdomain_type')
            ->with(['domain', 'allocation'])
            ->get();

        $syncedCount = 0;
        
        foreach ($servers as $server) {
            if (!$server->domain || !$server->domain->isAvailable()) {
                continue;
            }

            if (!$this->gameSupportsSubdomains($server->subdomain_type)) {
                // Delete DNS records for games that don't support subdomains
                if ($this->dnsManager->deleteSubdomainRecords($server)) {
                    $syncedCount++;
                }
                continue;
            }

            // Check if DNS records exist
            if ($this->dnsManager->subdomainExists($server->subdomain, $server->domain)) {
                // Update existing records
                if ($this->dnsManager->updateSubdomainRecords($server)) {
                    $syncedCount++;
                }
            } else {
                // Create missing records
                if ($this->dnsManager->createSubdomainRecords($server)) {
                    $syncedCount++;
                }
            }
        }

        Log::info('Completed DNS sync for all servers', [
            'total_servers' => $servers->count(),
            'synced_count' => $syncedCount,
        ]);

        return $syncedCount;
    }
}