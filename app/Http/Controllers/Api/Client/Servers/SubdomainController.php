<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Dns\DnsManager;
use Pterodactyl\Services\Servers\SubdomainService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain\SetSubdomainRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain\RemoveSubdomainRequest;
use Pterodactyl\Exceptions\DisplayException;

class SubdomainController extends ClientApiController
{
    public function __construct(
        private DnsManager $dnsManager,
        private SubdomainService $subdomainService,
    ) {
        parent::__construct();
    }

    /**
     * Get subdomain information for a server.
     */
    public function index(Server $server): JsonResponse
    {
        $subdomainConfig = $server->getSubdomainConfig();

        return new JsonResponse([
            'object' => 'subdomain',
            'attributes' => $subdomainConfig ?? [
                'subdomain' => null,
                'domain' => null,
                'full_domain' => null,
                'game' => null,
            ],
            'supports_subdomains' => $server->supportsSubdomains(),
            'available_domains' => $this->getAvailableDomainsForServer($server),
        ]);
    }

    /**
     * Set or update a subdomain for a server.
     */
    public function store(SetSubdomainRequest $request, Server $server): JsonResponse
    {
        try {
            $this->subdomainService->setSubdomain(
                $server,
                $request->input('subdomain'),
                $request->input('domain_id')
            );

            Activity::event('server:subdomain.set')
                ->property([
                    'subdomain' => $request->input('subdomain'),
                    'domain_id' => $request->input('domain_id'),
                    'type' => $server->fresh()->subdomain_type, // Get the auto-selected type
                ])
                ->log();

            return new JsonResponse(['message' => 'Subdomain configured successfully'], Response::HTTP_CREATED);
        } catch (DisplayException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            Log::error('Failed to set subdomain', [
                'server_id' => $server->id,
                'subdomain' => $request->input('subdomain'),
                'domain_id' => $request->input('domain_id'),
                'error' => $e->getMessage(),
            ]);
            
            return new JsonResponse(['error' => 'Failed to configure subdomain'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update a server's subdomain.
     */
    public function update(SetSubdomainRequest $request, Server $server): JsonResponse
    {
        try {
            $this->subdomainService->updateSubdomain(
                $server,
                $request->input('subdomain'),
                $request->input('domain_id')
            );

            Activity::event('server:subdomain.update')
                ->property([
                    'old_subdomain' => $server->subdomain,
                    'new_subdomain' => $request->input('subdomain'),
                    'old_domain_id' => $server->domain_id,
                    'new_domain_id' => $request->input('domain_id'),
                    'type' => $server->fresh()->subdomain_type, // Get the auto-selected type
                ])
                ->log();

            return new JsonResponse(['message' => 'Subdomain updated successfully']);
        } catch (DisplayException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            Log::error('Failed to update subdomain', [
                'server_id' => $server->id,
                'subdomain' => $request->input('subdomain'),
                'domain_id' => $request->input('domain_id'),
                'error' => $e->getMessage(),
            ]);
            
            return new JsonResponse(['error' => 'Failed to update subdomain'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove a subdomain from a server.
     */
    public function destroy(RemoveSubdomainRequest $request, Server $server): JsonResponse
    {
        try {
            $oldSubdomain = $server->subdomain;
            $oldDomain = $server->domain_id;
            
            $this->subdomainService->removeSubdomain($server);

            Activity::event('server:subdomain.remove')
                ->property([
                    'old_subdomain' => $oldSubdomain,
                    'old_domain_id' => $oldDomain,
                ])
                ->log();

            return new JsonResponse(['message' => 'Subdomain removed successfully']);
        } catch (DisplayException $e) {
            return new JsonResponse(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\Exception $e) {
            Log::error('Failed to remove subdomain', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            
            return new JsonResponse(['error' => 'Failed to remove subdomain'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check if a subdomain is available.
     */
    public function checkAvailability(Server $server): JsonResponse
    {
        $subdomain = request()->input('subdomain');
        $domainId = request()->input('domain_id');

        if (!$subdomain || !$domainId) {
            return new JsonResponse(['error' => 'Subdomain and domain_id are required'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $domain = Domain::findOrFail($domainId);
            $available = $this->subdomainService->checkAvailability($subdomain, $domain, $server);

            return new JsonResponse([
                'available' => $available,
                'subdomain' => $subdomain,
                'domain' => $domain->name,
                'full_domain' => $domain->getFullDomain($subdomain),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Failed to check availability'], Response::HTTP_BAD_REQUEST);
        }
    
        /**
         * Sync DNS records for the server's subdomain.
         */
        public function syncDns(Server $server): JsonResponse
        {
            if (!$server->hasSubdomain()) {
                return new JsonResponse(['error' => 'Server has no subdomain configured'], Response::HTTP_BAD_REQUEST);
            }
    
            try {
                $result = $this->dnsManager->createSubdomainRecords($server);
                
                if ($result) {
                    Activity::event('server:subdomain.dns-sync')
                        ->property(['subdomain' => $server->subdomain])
                        ->log();
                        
                    return new JsonResponse(['message' => 'DNS records synchronized successfully']);
                } else {
                    return new JsonResponse(['error' => 'Failed to synchronize DNS records'], Response::HTTP_INTERNAL_SERVER_ERROR);
                }
            } catch (\Exception $e) {
                Log::error('Failed to sync DNS records', [
                    'server_id' => $server->id,
                    'subdomain' => $server->subdomain,
                    'error' => $e->getMessage(),
                ]);
                
                return new JsonResponse(['error' => 'Failed to synchronize DNS records'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }
    }

    /**
     * Get available domains for a server based on its egg configuration.
     */
    private function getAvailableDomainsForServer(Server $server): array
    {
        return Domain::where('is_active', true)
            ->get()
            ->map(function (Domain $domain) {
                return [
                    'id' => $domain->id,
                    'name' => $domain->name,
                ];
            })
            ->toArray();
    }

    /**