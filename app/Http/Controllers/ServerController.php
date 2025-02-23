<?php

namespace Pterodactyl\Http\Controllers;

use Inertia\Inertia;
use Pterodactyl\Models\Server;
use Carbon\Carbon;
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
    /**
     * Check the server's plan and suspend if expired.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Pterodactyl\Models\Server  $server
     * @return void
     */
    
     protected function checkServerPlan(Request $request, $server)
     {
         if ($server && isset($server->plan)) {
             $plan = $server->plan;
 
             // Log the server and plan arrays
             Log::info('Server details:', ['server' => $server->toArray()]);
             Log::info('Plan details:', ['plan' => $plan]);
 
             // Check for expiration date in the nested plan structure
             $expiresAt = null;
             foreach ($plan as $planDetails) {
                 if (isset($planDetails['expires_at'])) {
                     $expiresAt = $planDetails['expires_at'];
                     break;
                 }
             }
 
             // Log expiration decision details with should_suspend flag
             $shouldSuspend = $expiresAt && Carbon::parse($expiresAt)->isPast();
             
             Log::info('Server plan expiration check', [
                 'server_id' => $server->id,
                 'expires_at' => $expiresAt,
                 'should_suspend' => $shouldSuspend
             ]);
 
             if ($shouldSuspend) {
                 // Suspend the server
                 $this->suspensionService->toggle($server, SuspensionService::ACTION_SUSPEND);
 
                 // Notify the user
                 $this->notificationService->notify(
                     $request->user()->id,
                     "Server Suspended Due to Expired Plan {$server->id}",
                     'This plan is expired for this server',
                     null,
                     'warning'
                 );
 
                 // Log the suspension action
                 Log::info('Server suspended due to expired plan', [
                     'server_id' => $server->id,
                     'expires_at' => $expiresAt
                 ]);
             }
         }
    }

    public function show(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();
            // Check the server's plan
            $this->checkServerPlan($request, $server);

            $isSuspendedDueToPlan = $this->checkServerPlan($request, $server);

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);

            // Check if server is suspended due to expired plan
            if ($isSuspendedDueToPlan) {
                return Inertia::render('Errors/Server/Expired');
            }

            

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

            $this->checkServerPlan($request, $server);

            $isSuspendedDueToPlan = $this->checkServerPlan($request, $server);

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);

            // Check if server is suspended due to expired plan
            if ($isSuspendedDueToPlan) {
                return Inertia::render('Errors/Server/Expired');
            }

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

            $this->checkServerPlan($request, $server);

            $isSuspendedDueToPlan = $this->checkServerPlan($request, $server);

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);

            // Check if server is suspended due to expired plan
            if ($isSuspendedDueToPlan) {
                return Inertia::render('Errors/Server/Expired');
            }

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

    public function Activity(Request $request, $uuidShort)
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
            
            return Inertia::render('Server/Activity', [
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

    public function show(Request $request, $uuidShort)
    {
        try {
            $server = Server::where('uuidShort', $uuidShort)->firstOrFail();
            // Check the server's plan
            $this->checkServerPlan($request, $server);

            $isSuspendedDueToPlan = $this->checkServerPlan($request, $server);

            \Log::info('Server suspension check', [
                'server_id' => $server->id,
                'is_suspended' => $server->is_suspended,
                'status' => $server->status
            ]);

            // Check if server is suspended due to expired plan
            if ($isSuspendedDueToPlan) {
                return Inertia::render('Errors/Server/Expired');
            }

            

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
            
            return Inertia::render('Server/', [
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