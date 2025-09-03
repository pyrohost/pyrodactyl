<?php

namespace Pterodactyl\Services\Servers;

use Exception;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Domain;
use Pterodactyl\Services\Dns\DnsManager;
use Pterodactyl\Services\Games\GameRegistry;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SubdomainService
{
    public function __construct(
        private DnsManager $dnsManager,
        private GameRegistry $gameRegistry
    ) {
    }

    /**
     * Set a subdomain for a server.
     *
     * @throws DisplayException
     */
    public function setSubdomain(Server $server, string $subdomain, int $domainId): void
    {
        $domain = $this->validateDomain($domainId);
        $this->validateServer($server);
        $gameType = $this->determineGameType($server);
        $this->validateSubdomainAvailability($subdomain, $domain, $server);

        DB::transaction(function () use ($server, $subdomain, $domainId, $gameType) {
            $this->updateServerSubdomain($server, $subdomain, $domainId, $gameType);
            $this->createDnsRecords($server);

            Log::info('Subdomain set successfully', [
                'server_id' => $server->id,
                'subdomain' => $subdomain,
                'domain_id' => $domainId,
                'game_type' => $gameType,
            ]);
        });
    }

    /**
     * Update a server's subdomain.
     *
     * @throws DisplayException
     */
    public function updateSubdomain(Server $server, string $subdomain, int $domainId): void
    {
        $domain = $this->validateDomain($domainId);
        $this->validateServer($server);
        $gameType = $this->determineGameType($server);
        
        $oldSubdomain = $server->subdomain;
        $oldDomainId = $server->domain_id;
        $hasChanged = $subdomain !== $oldSubdomain || $domainId !== $oldDomainId;

        if ($hasChanged) {
            $this->validateSubdomainAvailability($subdomain, $domain, $server);
        }

        DB::transaction(function () use ($server, $subdomain, $domainId, $gameType, $oldSubdomain, $oldDomainId, $hasChanged) {
            if ($hasChanged && $oldSubdomain && $oldDomainId) {
                $this->deleteOldDnsRecords($server, $oldSubdomain);
            }

            $this->updateServerSubdomain($server, $subdomain, $domainId, $gameType);
            $this->createDnsRecords($server);

            Log::info('Subdomain updated successfully', [
                'server_id' => $server->id,
                'old_subdomain' => $oldSubdomain,
                'new_subdomain' => $subdomain,
                'old_domain_id' => $oldDomainId,
                'new_domain_id' => $domainId,
                'game_type' => $gameType,
            ]);
        });
    }

    /**
     * Remove a subdomain from a server.
     *
     * @throws DisplayException
     */
    public function removeSubdomain(Server $server): void
    {
        if (!$server->hasSubdomain()) {
            throw new DisplayException('This server does not have a subdomain configured.');
        }

        $oldSubdomain = $server->subdomain;
        $oldDomainId = $server->domain_id;

        DB::transaction(function () use ($server, $oldSubdomain, $oldDomainId) {
            $this->deleteOldDnsRecords($server, $oldSubdomain);

            $server->update([
                'subdomain' => null,
                'subdomain_type' => null,
                'domain_id' => null,
            ]);

            Log::info('Subdomain removed successfully', [
                'server_id' => $server->id,
                'old_subdomain' => $oldSubdomain,
                'old_domain_id' => $oldDomainId,
            ]);
        });
    }

    /**
     * Validate and retrieve domain.
     *
     * @throws DisplayException
     */
    private function validateDomain(int $domainId): Domain
    {
        $domain = Domain::findOrFail($domainId);

        if (!$domain->is_active) {
            throw new DisplayException('The selected domain is not active.');
        }

        return $domain;
    }

    /**
     * Validate server supports subdomains.
     *
     * @throws DisplayException
     */
    private function validateServer(Server $server): void
    {
        if (!$server->supportsSubdomains()) {
            throw new DisplayException('This server\'s egg does not support subdomains.');
        }
    }

    /**
     * Determine the appropriate game type for the server.
     *
     * @throws DisplayException
     */
    private function determineGameType(Server $server): string
    {
        $availableGames = $this->gameRegistry->getAvailableForServer($server);
        
        if (empty($availableGames)) {
            throw new DisplayException('No game types are available for this server configuration.');
        }
        
        $gameType = $availableGames[0]->getName();
        
        Log::info('Auto-selected game type for subdomain', [
            'server_id' => $server->id,
            'game_type' => $gameType,
            'available_games' => array_map(fn($preset) => $preset->getName(), $availableGames),
        ]);

        return $gameType;
    }

    /**
     * Validate subdomain availability.
     *
     * @throws DisplayException
     */
    private function validateSubdomainAvailability(string $subdomain, Domain $domain, ?Server $excludeServer = null): void
    {
        if (!$this->checkAvailability($subdomain, $domain, $excludeServer)) {
            throw new DisplayException('This subdomain is already taken on the selected domain.');
        }
    }

    /**
     * Update server with subdomain information.
     */
    private function updateServerSubdomain(Server $server, string $subdomain, int $domainId, string $gameType): void
    {
        $server->update([
            'subdomain' => $subdomain,
            'subdomain_type' => $gameType,
            'domain_id' => $domainId,
        ]);
    }

    /**
     * Create DNS records for the server.
     *
     * @throws DisplayException
     */
    private function createDnsRecords(Server $server): void
    {
        if (!$this->dnsManager->createSubdomainRecords($server)) {
            throw new DisplayException('Failed to create DNS records for the subdomain.');
        }
    }

    /**
     * Delete old DNS records with error handling.
     */
    private function deleteOldDnsRecords(Server $server, string $oldSubdomain): void
    {
        try {
            $this->dnsManager->deleteSubdomainRecords($server);
        } catch (Exception $e) {
            Log::warning('Failed to delete DNS records', [
                'server_id' => $server->id,
                'subdomain' => $oldSubdomain,
                'error' => $e->getMessage(),
            ]);
            // Continue with operation even if deletion fails
        }
    }

    /**
     * Check if a subdomain is available on a domain.
     */
    public function checkAvailability(string $subdomain, Domain $domain, ?Server $excludeServer = null): bool
    {
        $query = Server::where('subdomain', $subdomain)
            ->where('domain_id', $domain->id);

        if ($excludeServer) {
            $query->where('id', '!=', $excludeServer->id);
        }

        return !$query->exists();
    }

}