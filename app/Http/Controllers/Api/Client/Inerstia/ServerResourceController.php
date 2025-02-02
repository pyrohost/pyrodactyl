<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Inerstia;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Pterodactyl\Exceptions\DisplayException;
use Illuminate\Support\Facades\DB;
use Pterodactyl\Exceptions\Service\Server\ResourceValidatorService;

class ServerResourceController extends Controller 


{

    protected $validatorService;

    public function __construct(ResourceValidatorService $validatorService) 
    {
        $this->validatorService = $validatorService;
    }

    public function index(Request $request, $uuidShort)
    {
        $server = Server::where('uuidShort', $uuidShort)->first();

        if (!$server || !$server->exists) {
            return Inertia::render('Errors/Server/404', [], 404);
        }

        return Inertia::render('Server/ResourceEditor', [
            'server' => $server,
            'limits' => auth()->user()->limits,
            'resources' => auth()->user()->resources,
            'availableResources' => [
    'memory' => auth()->user()->limits['memory'] - auth()->user()->resources['memory'],
    'disk' => auth()->user()->limits['disk'] - auth()->user()->resources['disk'],
    'cpu' => auth()->user()->limits['cpu'] - auth()->user()->resources['cpu'],
    'allocations' => auth()->user()->limits['allocations'] - auth()->user()->resources['allocations'],
    'databases' => auth()->user()->limits['databases'] - auth()->user()->resources['databases'],
    'backups' => auth()->user()->limits['backups'] - auth()->user()->resources['backups']
]
        ]);
    }


    public function update(Request $request, $uuidShort)
    {
        $server = Server::where('uuidShort', $uuidShort)->first();

        if (!$server || !$server->exists) {
            return back()->with('error', 'Server not found');
        }

        $validated = $request->validate([
            'memory'           => 'required|numeric|min:0',
            'disk'             => 'required|numeric|min:0',
            'cpu'              => 'required|numeric|min:0',
            'allocation_limit' => 'required|numeric|min:0',
            'database_limit'   => 'required|numeric|min:0',
            'backup_limit'     => 'required|numeric|min:0',
            'databases'        => 'required|numeric|min:0',
            'backups'          => 'required|numeric|min:0',
        ]);
        
        try {
            $this->validatorService->validate($validated, $server, auth()->user());
            
            $oldValues = [
                'memory'      => $server->memory,
                'disk'        => $server->disk,
                'cpu'         => $server->cpu,
                'allocations' => $server->allocation_limit,
                'databases'   => $server->databases,  // updated property for current databases count
                'backups'     => $server->backups,    // updated property for current backups count
            ];
            
            $user = auth()->user();
            
            // Check if user has enough resources for each change
            $requiredResources = [
                'memory'      => $validated['memory'] - $oldValues['memory'],
                'disk'        => $validated['disk'] - $oldValues['disk'],
                'cpu'         => $validated['cpu'] - $oldValues['cpu'],
                'allocations' => $validated['allocation_limit'] - $oldValues['allocations'],
                'databases'   => $validated['databases'] - $oldValues['databases'],
                'backups'     => $validated['backups'] - $oldValues['backups'],
            ];
            
            // Verify each resource availability
            foreach ($requiredResources as $resource => $amount) {
                if ($amount > 0 && $user->resources[$resource] < $amount) {
                    throw new DisplayException("Insufficient {$resource} resources available. You need {$amount} more.");
                }
            }
        
            // Update user's resources (Not needed) 
            // The user's resources are looked up in the database when needed
            /*foreach ($requiredResources as $resource => $amount) {
                $user->resources[$resource] -= $amount;
            }
            $user->save();*/

        
            // Update server resources
            $server->update([
                'memory' => $validated['memory'],
                'disk' => $validated['disk'],
                'cpu' => $validated['cpu'],
                'allocation_limit' => $validated['allocation_limit'],
                'database_limit' => $validated['database_limit'],
                'backup_limit' => $validated['backup_limit']
            ]);
            return back()->with('success', [
                'title' => 'Successfully Edited Resources',
                'desc' => "You have changed your server's resources successfully."
            ]);
        } catch (DisplayException $e) {
            
            return back()->with('error', [
                'title' => 'Oops. Something went wrong!',
                'desc' => $e->getMessage()
            ]);
        }
    }
}