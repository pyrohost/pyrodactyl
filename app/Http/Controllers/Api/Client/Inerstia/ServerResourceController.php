<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Inerstia;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Service\Server\ResourceValidatorService;

class ServerResourceController extends Controller 


{

    protected $validatorService;

    public function __construct(ResourceValidatorService $validatorService) 
    {
        $this->validatorService = $validatorService;
    }

    public function index($uuidShort)
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


    public function update(Request $request, Server $server)
{
    $validated = $request->validate([
        'memory' => 'required|numeric|min:0',
        'disk' => 'required|numeric|min:0',
        'cpu' => 'required|numeric|min:0',
        'allocation_limit' => 'required|numeric|min:0',
        'database_limit' => 'required|numeric|min:0',
        'backup_limit' => 'required|numeric|min:0'
    ]);

    try {
        $this->validatorService->validate($validated, $server, auth()->user());
        
        $oldValues = [
            'memory' => $server->memory,
            'disk' => $server->disk,
            'cpu' => $server->cpu,
            'allocations' => $server->allocation_limit,
            'databases' => $server->database_limit,
            'backups' => $server->backup_limit
        ];
    
        $user = auth()->user();
        
        $requiredResources = [
            'memory' => $validated['memory'] - $oldValues['memory'],
            'disk' => $validated['disk'] - $oldValues['disk'],
            'cpu' => $validated['cpu'] - $oldValues['cpu'],
            'allocations' => $validated['allocation_limit'] - $oldValues['allocations'],
            'databases' => $validated['database_limit'] - $oldValues['databases'],
            'backups' => $validated['backup_limit'] - $oldValues['backups']
        ];
    
        DB::beginTransaction();
        
        try {
            // Check resource availability and update user resources
            foreach ($requiredResources as $resource => $amount) {
                if ($amount > 0) {
                    if ($user->resources[$resource] < $amount) {
                        throw new DisplayException("Insufficient {$resource} resources. Need {$amount} more.");
                    }
                    $user->resources[$resource] -= $amount;
                } else if ($amount < 0) {
                    // Return resources to user if reducing
                    $user->resources[$resource] += abs($amount);
                }
            }
            
            $user->save();
    
            // Update server resources
            $server->update([
                'memory' => $validated['memory'],
                'disk' => $validated['disk'],
                'cpu' => $validated['cpu'],
                'allocation_limit' => $validated['allocation_limit'],
                'database_limit' => $validated['database_limit'],
                'backup_limit' => $validated['backup_limit']
            ]);
            
            DB::commit();
            return back()->with('success', 'Server resources updated successfully');
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
        
    } catch (DisplayException $e) {
        return back()->with('error', $e->getMessage());
    } catch (\Exception $e) {
        return back()->with('error', 'An unexpected error occurred.');
    }
}
}