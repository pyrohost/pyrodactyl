<?php

namespace Pterodactyl\Http\Controllers;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Services\Servers\GetUserPermissionsService;
use Pterodactyl\Services\Servers\SuspensionService;
use Pterodactyl\Services\Notifications\NotificationService;
use League\Fractal\Manager;
use League\Fractal\Resource\Item;
use Illuminate\Support\Facades\Log; // Add this import
use Illuminate\Support\Facades\Http;


class ServerController extends Controller
{
    private SuspensionService $suspensionService;
private NotificationService $notificationService;
private GetUserPermissionsService $permissionsService;
private Manager $fractal;

public function __construct(
    SuspensionService $suspensionService,
    NotificationService $notificationService,
    GetUserPermissionsService $permissionsService
) {
    $this->suspensionService = $suspensionService;
    $this->notificationService = $notificationService;
    $this->permissionsService = $permissionsService;
    $this->fractal = new Manager();
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
            
            return Inertia::render('Server/Etc', [
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

    public function upgrade(Request $request, $uuidShort)
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
            
            return Inertia::render('Server/Upgrade', [
                'server' => array_merge($transformed['data'], [
                    'is_server_owner' => $request->user()->id === $server->owner_id,
                    'user_permissions' => $this->permissionsService->handle($server, $request->user()),
                ])
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Errors/Server/404');
        }
    }

    public function suspend(Request $request, Server $server) 
    {
        // Check ownership
        if ($request->user()->id !== $server->owner_id) {
            return back()->with('error', [
                'title' => 'You have no permisson',
                'desc' => 'This useer lacks the permission to suspend this server'
            ]);
        }

        try {
            // Suspend server
            $this->suspensionService->toggle($server, SuspensionService::ACTION_SUSPEND);

            // Notify user
            $this->notificationService->notify(
                $request->user()->id,
                'Server Suspended',
                "Your server {$server->name} has been suspended.",
                null,
                'warning'
            );

            // Send Discord webhook if configured
            if ($webhookUrl = env('DISCORD_WEBHOOK')) {
                \Illuminate\Support\Facades\Http::post($webhookUrl, [
                    'embeds' => [[
                        'title' => 'Server Suspended',
                        'description' => "Server {$server->name} (ID: {$server->id}) was suspended for containg a .sh file",
                        'color' => 16711680, // Red
                        'fields' => [
                            [
                                'name' => 'Owner',
                                'value' => $request->user()->username,
                                'inline' => true
                            ],
                            [
                                'name' => 'Server ID',
                                'value' => $server->id,
                                'inline' => true
                            ]
                        ]
                    ]]
                ]);
            }

            return back()->with('suceess', [ //suceess
                'title' => 'Suspended Successfully',
                'desc' => 'Your server was caught having illegal items and has been suspended.'
            ]);
            
        } catch (\Exception $e) {
            return back()->with('error', [
                'title' => 'Suspension Failed',
                'desc' => $e->getMessage()
            ]);
            
        }
    }
}