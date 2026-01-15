<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Domain;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\ServerSubdomain;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;
use Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain\CreateSubdomainRequest;
use Pterodactyl\Transformers\Api\Client\ServerSubdomainTransformer;

class SubdomainController extends ClientApiController
{
    public function __construct(private SubdomainManagementService $subdomainService)
    {
        parent::__construct();
    }

    /**
     * Get subdomain information for a server.
     *
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_READ, $server);

        try {
            // Check if server supports subdomains
            $feature = $this->subdomainService->getServerSubdomainFeature($server);
            if (!$feature) {
                return response()->json([
                    'supported' => false,
                    'message' => 'This server does not support subdomains.'
                ]);
            }

            $currentSubdomain = $server->activeSubdomain;
            $availableDomains = $this->subdomainService->getAvailableDomains();

            return response()->json([
                'supported' => true,
                'current_subdomain' => $currentSubdomain ? [
                    'object' => 'server_subdomain',
                    'attributes' => [
                        'subdomain'  => $currentSubdomain->subdomain,
                        'domain'     => $currentSubdomain->domain->name,
                        'domain_id'  => $currentSubdomain->domain_id,
                        'full_domain' => $currentSubdomain->full_domain,
                        'is_active'  => $currentSubdomain->is_active,
                    ]
                ] : null,
                'available_domains' => $availableDomains,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to retrieve subdomain information.'
            ], 500);
        }
    }

    /**
     * Create a new subdomain for the server, or replace an existing one.
     *
     * @return JsonResponse
     */
    public function store(CreateSubdomainRequest $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_CREATE, $server);

        $data = $request->validated();

        try {
            // Get ALL active subdomains for this server (more than one should be impossible, but PHP makes me angry)
            $existingSubdomains = $server->subdomains()->where('is_active', true)->get();

            $domain = Domain::where('id', $data['domain_id'])
                ->where('is_active', true)
                ->first();

            if (!$domain) {
                return response()->json([
                    'error' => 'Selected domain is not available.'
                ], 422);
            }

            if ($existingSubdomains->isNotEmpty()) {
                foreach ($existingSubdomains as $existingSubdomain) {
                    try {
                        $this->subdomainService->deleteSubdomain($existingSubdomain);
                        Log::info("Deleted existing subdomain {$existingSubdomain->full_domain} during replacement for server {$server->id}");
                    } catch (\Exception $e) {
                        Log::error("Failed to delete existing subdomain {$existingSubdomain->full_domain} during replacement: {$e->getMessage()}");
                        return response()->json([
                            'error' => 'Failed to remove existing subdomain. Please try again.'
                        ], 422);
                    }
                }
                // Refresh server relationship to ensure we get updated data
                $server->refresh();
            }

            $serverSubdomain = $this->subdomainService->createSubdomain(
                $server,
                $domain,
                $data['subdomain']
            );

            return response()->json([
                'message' => $existingSubdomains->isNotEmpty() ? 'Subdomain replaced successfully.' : 'Subdomain created successfully.',
                'subdomain' => [
                    'object' => 'server_subdomain',
                    'attributes' => [
                        'subdomain'  => $serverSubdomain->subdomain,
                        'domain'     => $serverSubdomain->domain->name,
                        'domain_id'  => $serverSubdomain->domain_id,
                        'full_domain' => $serverSubdomain->full_domain,
                        'is_active'  => $serverSubdomain->is_active,
                    ],
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Subdomain creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'server_id' => $server->id,
                'domain_id' => $data['domain_id'] ?? null,
                'subdomain' => $data['subdomain'] ?? null,
                'existing_subdomains_count' => $existingSubdomains->count()
            ]);
            return response()->json([
                'error' => $existingSubdomains->isNotEmpty() ? 'Failed to replace subdomain.' : 'Failed to create subdomain.'
            ], 422);
        }
    }

    /**
     * Delete the server's subdomain.
     */
    public function destroy(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_DELETE, $server);

        try {
            $serverSubdomains = $server->subdomains()->where('is_active', true)->get();
            if ($serverSubdomains->isEmpty()) {
                return response()->json([
                    'error' => 'Server does not have any active subdomains.'
                ], 404);
            }

            foreach ($serverSubdomains as $serverSubdomain) {
                $this->subdomainService->deleteSubdomain($serverSubdomain);
                Log::info("Deleted subdomain {$serverSubdomain->full_domain} for server {$server->id}");
            }

            return response()->json([
                'message' => 'Subdomain(s) deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Subdomain creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'server_id' => $server->id,
                'domain_id' => $data['domain_id'] ?? null,
                'subdomain' => $data['subdomain'] ?? null,
                'existing_subdomains_count' => $existingSubdomains->count()
            ]);
            return response()->json([
                'error' => 'Failed to delete subdomain(s).'
            ], 422);
        }
    }

    /**
     * Check if a subdomain is available.
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        $server = $request->attributes->get('server');

        $this->authorize(Permission::ACTION_ALLOCATION_READ, $server);

        $request->validate([
            'subdomain' => 'required|string|min:1|max:63|regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/',
            'domain_id' => 'required|integer|exists:domains,id',
        ]);

        try {
            $domain = Domain::where('id', $request->input('domain_id'))
                ->where('is_active', true)
                ->first();

            if (!$domain) {
                return response()->json([
                    'error' => 'Selected domain is not available.'
                ], 422);
            }

            $subdomain = strtolower(trim($request->input('subdomain')));
            $availabilityResult = $this->subdomainService->checkSubdomainAvailability($subdomain, $domain);

            return response()->json([
                'available' => $availabilityResult['available'],
                'message' => $availabilityResult['message']
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to check subdomain availability.'
            ], 422);
        }
    }
}

