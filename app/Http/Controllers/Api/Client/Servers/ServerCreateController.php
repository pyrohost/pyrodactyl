<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Allocation;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Http\Requests\Api\Client\Servers\CreateServerRequest;
use Pterodactyl\Exceptions\DisplayException;

class CreateServerController extends Controller
{
    public function __construct(
        private ServerCreationService $creationService
    ) {}

    public function __invoke(CreateServerRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Calculate available resources
        $available = [
            'cpu' => $user->limits['cpu'] - $user->resources['cpu'],
            'memory' => $user->limits['memory'] - $user->resources['memory'],
            'disk' => $user->limits['disk'] - $user->resources['disk'],
            'servers' => $user->limits['servers'] - $user->resources['servers'],
            'databases' => $user->limits['databases'] - $user->resources['databases'],
            'backups' => $user->limits['backups'] - $user->resources['backups'],
            'allocations' => $user->limits['allocations'] - $user->resources['allocations'],
        ];

        // Validate against available resources
        if ($request->input('cpu') > $available['cpu']) {
            throw new DisplayException('Insufficient CPU resources available');
        }
        if ($request->input('memory') > $available['memory']) {
            throw new DisplayException('Insufficient memory resources available');
        }
        if ($request->input('disk') > $available['disk']) {
            throw new DisplayException('Insufficient disk resources available');
        }
        if ($available['servers'] <= 0) {
            throw new DisplayException('Server limit reached');
        }

        // Find random allocation
        $allocation = Allocation::query()
            ->where('node_id', $request->input('node_id'))
            ->whereNull('server_id')
            ->inRandomOrder()
            ->first();

        if (!$allocation) {
            throw new DisplayException('No available allocations found');
        }

        $server = $this->creationService->handle([
            'name' => $request->input('name'),
            'owner_id' => $user->id,
            'egg_id' => $request->input('egg_id'),
            'allocation_id' => $allocation->id,
            'node_id' => $request->input('node_id'),
            'memory' => $request->input('memory'),
            'disk' => $request->input('disk'),
            'cpu' => $request->input('cpu'),
            'startup' => $request->input('startup', ''),
            'image' => $request->input('docker_image', ''),
            'databases' => min($request->input('databases', 0), $available['databases']),
            'backups' => min($request->input('backups', 0), $available['backups']),
            'allocations' => min($request->input('allocations', 1), $available['allocations']),
            'skip_scripts' => false,
            'oom_disabled' => true,
        ]);

        return new JsonResponse([
            'data' => [
                'id' => $server->id,
                'uuid' => $server->uuid,
                'message' => 'Server created successfully'
            ]
        ], 201);
    }
}