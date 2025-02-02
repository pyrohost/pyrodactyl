<?php

namespace Pterodactyl\Http\Controllers;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Services\Servers\GetUserPermissionsService;
use League\Fractal\Manager;
use League\Fractal\Resource\Item;
use Illuminate\Support\Facades\Log; // Add this import

class ServerController extends Controller
{
    protected $fractal;
    protected $permissionsService;

    public function __construct(GetUserPermissionsService $permissionsService)
    {
        $this->fractal = new Manager();
        $this->permissionsService = $permissionsService;
    }

    public function show(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/Index', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }

    public function console(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/Console', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }


    public function etc(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/ETC', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }

    public function util(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/Util', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }

    public function files(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/File', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }

    public function settings(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);
            
            // Check if server is suspended
            if ($server->status === 'suspended') {
                return Inertia::render('Errors/Server/Suspended');
            }

            if ($server->status === 'installing') {
                return Inertia::render('Errors/Server/Install');
            }
            
            $transformer = new ServerTransformer();
            $transformer->setRequest($request);
            
            $resource = new Item($server, $transformer);
            $transformed = $this->fractal->createData($resource)->toArray();
            
            return Inertia::render('Server/Settings', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }
}