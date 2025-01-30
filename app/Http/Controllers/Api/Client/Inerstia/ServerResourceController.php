<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Inerstia;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Servers\ResourceValidatorService;

class ServerResourceController extends Controller 
{
    public function index(Server $server)
{
    if (!$server || !$server->exists) {
        return Inertia::render('Errors/Server/404', [], 404);
    }

    return Inertia::render('Server/ResourceEditor', [
        'server' => $server,
        'limits' => auth()->user()->limits,
        'resources' => auth()->user()->resources,
        'availableResources' => [
            'memory' => auth()->user()->limits['memory'] - auth()->user()->resources['memory'] + $server->memory,
            'disk' => auth()->user()->limits['disk'] - auth()->user()->resources['disk'] + $server->disk,
            'cpu' => auth()->user()->limits['cpu'] - auth()->user()->resources['cpu'] + $server->cpu,
            'allocations' => auth()->user()->limits['allocations'] - auth()->user()->resources['allocations'] + $server->allocation_limit,
            'databases' => auth()->user()->limits['databases'] - auth()->user()->resources['databases'] + $server->database_limit,
            'backups' => auth()->user()->limits['backups'] - auth()->user()->resources['backups'] + $server->backup_limit
        ]
    ]);
}

    public function update(Server $server)
    {
        $validated = request()->validate([
            'memory' => 'required|numeric|min:1',
            'disk' => 'required|numeric|min:1',
            'cpu' => 'required|numeric|min:1',
            'allocation_limit' => 'required|numeric|min:1',
            'database_limit' => 'required|numeric|min:0',
            'backup_limit' => 'required|numeric|min:0'
        ]);

        $this->validatorService->validate($validated, $server, auth()->user());

        $server->update([
            'memory' => $validated['memory'],
            'disk' => $validated['disk'],
            'cpu' => $validated['cpu'],
            'allocation_limit' => $validated['allocation_limit'],
            'database_limit' => $validated['database_limit'],
            'backup_limit' => $validated['backup_limit']
        ]);

        return back()->with('success', 'Server resources and limits updated successfully');
    }
}