<?php

namespace Pterodactyl\Http\Controllers\Base\Servers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Location;
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
    $activePlan = $user->purchases_plans['Free Tier'];
    
    if (!$activePlan) {
        throw new DisplayException('No active plan found');
    }

    // Get locations with available nodes
    $locations = Location::with(['nodes' => function($query) {
        $query->select(['id', 'name', 'location_id'])
            ->where('public', true);
    }])->get()->filter(function($location) use ($activePlan) {
        return $location->nodes->count() > 0 
            && $location->userHasRequiredPlan([$activePlan['name']])
            && !$location->hasReachedMaximumServers();
    });

    $eggs = Nest::with(['eggs' => function($query) {
        $query->whereRaw("LOWER(description) LIKE '%server_ready%'")
            ->select(['id', 'nest_id', 'name', 'description', 'image_url']);
    }])->get();

    return Inertia::render('Dash/Deploy/ServerCreate', [
        'plan' => $activePlan,
        'eggs' => $eggs,
        'locations' => $locations,
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
                throw new DisplayException('Plan not found in database.');
            }

            $validated = $request->validate([
                'name' => 'required|string|min:3',
                'egg_id' => 'required|exists:eggs,id',
                'location_id' => 'required|exists:locations,id'
            ]);

            

            $location = Location::findOrFail($validated['location_id']);

            //
            
            // Get random node from location
            // Get random node from location
            $node = $location->nodes()
                ->where('public', true)
                ->inRandomOrder()
                ->firstOrFail();

            
            //define nodes

            $node_id = $node->id;

            Log::info('Selected node for server creation', [
                'location_id' => $location->id,
                'node_id' => $node->id
            ]);

            Log::info('Selected node for server creation', [
                'location_id' => $location->id,
                'node_id' => $node->id
            ]);

            // Get egg and its variables
            $egg = \Pterodactyl\Models\Egg::find($validated['egg_id']);

            if (!$egg) {
                throw new DisplayException('Invalid egg configuration');
            }
            
            // Default to Java 17 for Bungeecord
            $dockerImages = array_values($egg->docker_images);
            $dockerImage = $dockerImages[array_rand($dockerImages)];

            if (!$dockerImage) {
                throw new DisplayException('No valid docker image found for this egg');
            }

            Log::info('Full Egg Model', [
                'egg' => $egg->toArray(),
                'egg_attributes' => $egg->getAttributes(),
                'relationships' => [
                    'variables' => $egg->variables->toArray(),
                    'nest' => $egg->nest ? $egg->nest->toArray() : null
                ]
            ]);

            

            /* Log::info('Egg variables found', [
                    'egg_id' => $egg->id,
                    'variables' => $egg->variables->toArray()
                ]);*/

            // User model updater
            
        
            // Get activated plan count
            // Get purchased and activated plan counts
            $purchasedPlanCount = $user->purchases_plans[$activePlanName]['count'] ?? 0;
            $activatedPlans = $user->activated_plans ?? [];

           
    
            Log::info('Plan validation', [
                'plan_name' => $activePlanName,
                'purchased_count' => $purchasedPlanCount,
                'activated_plans' => $activatedPlans
            ]);

            // Check if plan is already activated
            if (isset($activatedPlans[$activePlanName])) {
                throw new DisplayException("Plan {$activePlanName} is already activated");
            }

            if (count($activatedPlans) >= $purchasedPlanCount) {
                throw new DisplayException("No more {$activePlanName} plans available to activate");
            }


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

            Log::info('Server creation details', [
                'egg_id' => $egg->id,
                'docker_image' => $dockerImage,
                'startup' => $egg->startup
            ]);

            $allocation = Allocation::query()
                ->whereNull('server_id')
                ->where('node_id', $node->id)  // Use node from location
                ->inRandomOrder()
                ->first();

            if (!$allocation) { 
                throw new DisplayException('No available allocations found');
            }

            
            Log::info('Server creation details', [
                'egg_id' => $egg->id,
                'docker_image' => $dockerImage,
                'startup' => $egg->startup
            ]);

            // Add plan to activated plans
            $activatedPlans[$activePlanName] = [
                'plan_id' => $plan->id,
                'name' => $plan->name,
                'activated_on' => now()->toDateTimeString()
            ];
            
            $user->update([
                'activated_plans' => $activatedPlans
            ]);
            
            // Reload the user to see the change:
            $updatedUser = $user->fresh();
            Log::info('Activated plan updated', [
                'activated_plan' => $updatedUser->activated_plans[$activePlanName] ?? 'Not set'
            ]);



            $server = $this->creationService->handle([
                'name' => $validated['name'],
                'owner_id' => $user->id,
                'egg_id' => $validated['egg_id'],
                'node_id' => $node->id,  // Use node from location query instead of validated data
                'allocation_id' => $allocation->id,
                'cpu' => $plan->cpu,
                'memory' => $plan->memory,
                'disk' => $plan->disk,
                'database_limit' => $plan->databases,
                'allocation_limit' => $plan->allocations,
                'backup_limit' => $plan->backups,
                'environment' => $variables,
                'swap' => 0,
                'io' => 500,
                'startup' => $egg->startup,
                'image' => $dockerImage,
                'skip_scripts' => false,
                'oom_disabled' => true,
                'plans' => [
                    $plan->name => [
                        'activated_on' => now()->toDateTimeString()
                    ]
                ]
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




