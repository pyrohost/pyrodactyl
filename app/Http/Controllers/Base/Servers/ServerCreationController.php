<?php

namespace Pterodactyl\Http\Controllers\Base\Servers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\ServerCreationService;
use Illuminate\Support\Facades\Log;

class ServerCreationController extends Controller
{
    public function __construct(
        private ServerCreationService $creationService
    ) {}

    public function index()
    {
        $user = auth()->user();
        $activePlan = $user->purchases_plans['Free Tier'] ?? null;

        if (!$activePlan) {
            Log::error('No active plan found for user', ['user_id' => $user->id]);
            throw new DisplayException('No active plan found');
        }

        Log::info('User Active Plan', [
            'user_id' => $user->id,
            'plan' => $activePlan ? json_encode($activePlan) : 'No plan found'
        ]);

        if (!$activePlan) {
            throw new DisplayException('No active plan found');
        }

        $eggs = Nest::with(['eggs' => function($query) {
            $query->whereRaw("LOWER(description) LIKE '%server_ready%'")
                ->select(['id', 'nest_id', 'name', 'description', 'image_url']);
        }])->get();

        return Inertia::render('Dash/Deploy/ServerCreate', [
            'plan' => $activePlan,
            'eggs' => $eggs,
            'limits' => [
                'cpu' => $activePlan['cpu'],
                'memory' => $activePlan['memory'],
                'disk' => $activePlan['disk'],
                'servers' => $activePlan['servers'],
                'allocations' => $activePlan['allocations'],
                'databases' => $activePlan['databases'],
                'backups' => $activePlan['backups']
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $activePlan = $user->purchases_plans['Free Tier'] ?? null;

        if (!$activePlan) {
            throw new DisplayException('No active plan found');
        }

        $validated = $request->validate([
            'name' => 'required|string|min:3',
            'egg_id' => 'required|exists:eggs,id',
            'node_id' => 'required|exists:nodes,id'
        ]);

        // Find random allocation
        $allocation = Allocation::query()
            ->whereNull('server_id')
            ->where('node_id', $validated['node_id'])
            ->inRandomOrder()
            ->first();

        if (!$allocation) {
            throw new DisplayException('No available allocations');
        }

        return $this->creationService->handle([
            'name' => $validated['name'],
            'owner_id' => $user->id,
            'egg_id' => $validated['egg_id'],
            'node_id' => $validated['node_id'],
            'allocation_id' => $allocation->id,
            'cpu' => $activePlan['cpu'],
            'memory' => $activePlan['memory'],
            'disk' => $activePlan['disk'],
            'database_limit' => $activePlan['databases'],
            'allocation_limit' => $activePlan['allocations'],
            'backup_limit' => $activePlan['backups']
        ]);
    }
}