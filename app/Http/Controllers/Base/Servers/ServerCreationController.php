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
    try {
        $user = auth()->user();
        $activePlanName = $user->purchases_plans['Free Tier']['name'] ?? null;

        if (!$activePlanName) {
            throw new DisplayException('No active plan found');
        }

        $plan = \Pterodactyl\Models\Plan::where('name', $activePlanName)->first();
        
        if (!$plan) {
            throw new DisplayException('Plan not found in database');
        }

        $validated = $request->validate([
            'name' => 'required|string|min:3',
            'egg_id' => 'required|exists:eggs,id',
            'node_id' => 'required|exists:nodes,id'
        ]);

        // Get egg and its variables
        $egg = \Pterodactyl\Models\Egg::find($validated['egg_id']);

        Log::info('Egg data', [
            'egg_id' => $egg->id,
            'docker_image' => $egg->docker_image,
            'variables' => $egg->variables->toArray()
        ]);

        Log::info('Egg variables found', [
            'egg_id' => $egg->id,
            'variables' => $egg->variables->toArray()
        ]);


        $variables = $egg->variables->transform(function($item) {
            return [
                $item->env_variable => $item->default_value ?? '',
            ];
        })->mapWithKeys(function ($item) {
            return $item;
        })->toArray();


        Log::info('Transformed variables for server creation', [
            'variables' => $variables
        ]);

        $allocation = Allocation::query()
            ->whereNull('server_id')
            ->where('node_id', $validated['node_id'])
            ->inRandomOrder()
            ->first();

        if (!$allocation) {
            throw new DisplayException('No available allocations found');
        }

        $server = $this->creationService->handle([
            'name' => $validated['name'],
            'owner_id' => $user->id,
            'egg_id' => $validated['egg_id'],
            'node_id' => $validated['node_id'],
            'allocation_id' => $allocation->id,
            'cpu' => $plan->cpu,
            'memory' => $plan->memory,
            'disk' => $plan->disk,
            'database_limit' => $plan->databases,
            'allocation_limit' => $plan->allocations,
            'backup_limit' => $plan->backups,
            'environment' => $variables,
            // Add required fields
            'swap' => 0,
            'io' => 500,
            'startup' => $egg->startup,
            'image' => $egg->docker_image,
            'skip_scripts' => false,
            'oom_disabled' => true
        ]);

        return back()->with('success', [
            'title' => 'Server Created Successfully',
            'desc' => "Your server {$validated['name']} has been created and is being installed."
        ]);

    } catch (DisplayException $e) {
        return back()->with('error', [
            'title' => 'Server Creation Failed',
            'desc' => $e->getMessage()
        ]);
    }

}
}