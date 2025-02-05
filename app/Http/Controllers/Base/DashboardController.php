<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Model;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controller as BaseController;

class DashboardController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(): Response
    {
        if (!Auth::check()) {
            return Inertia::location(route('auth.login'));
        }
        
        return Inertia::render('Dashboard');
    }

    public function deploy()
    {
        $nests = Nest::where('name', 'not like', '%No_show%')
            ->with(['eggs' => function($query) {
                $query->select(['id', 'nest_id', 'name', 'description', 'image_url']);
            }])
            ->get();

        $user = auth()->user();

        return Inertia::render('Dash/Deploy/ServerCreate', [
            'nests' => $nests,
            'user' => [
                'limits' => $user->limits,
                'resources' => $user->resources,
                'available' => [
                    'cpu' => $user->limits['cpu'] - $user->resources['cpu'],
                    'memory' => $user->limits['memory'] - $user->resources['memory'],
                    'disk' => $user->limits['disk'] - $user->resources['disk'],
                    'databases' => $user->limits['databases'] - $user->resources['databases'],
                    'backups' => $user->limits['backups'] - $user->resources['backups'],
                    'allocations' => $user->limits['allocations'] - $user->resources['allocations'],
                    'servers' => $user->limits['servers'] - $user->resources['servers'],
                ]
            ]
        ]);
    }


    public function watch(): Response
{
    if (!Auth::check()) {
        return Inertia::location(route('auth.login'));
    }
    
    return Inertia::render('Dash/Watch', [
        'user' => Auth::user(),
        'servers' => Auth::user()->servers,
    ]);
}

    public function servers(): Response
{
    if (!Auth::check()) {
        return Inertia::location(route('auth.login'));
    }
    
    return Inertia::render('Dash/Servers', [
        'user' => Auth::user(),
        'servers' => Auth::user()->servers,
    ]);

}

public function shop(): Response
{
    if (!Auth::check()) {
        return Inertia::location(route('auth.login'));
    }

    $error = 'Shop has been disabled for this instance.';

    if (!str_contains(strtolower(env('MODE')), 'resource')) {
        return Inertia::render('Errors/Earn/Disable', ['why' => $error]);
    }

    $resource = \Pterodactyl\Models\ShopResources::all();

    return Inertia::render('Shop/Overview', [
        'user' => Auth::user(),
        'servers' => Auth::user()->servers,
        'resource' => $resource,
    ]);
}

public function logout(): Response
{
    if (!Auth::check()) {
        return Inertia::location(route('auth.login'));
    }

    $resource = \Pterodactyl\Models\ShopResources::all();

    return Inertia::render('Auth/Logout', [
        'user' => Auth::user(),
        'servers' => Auth::user()->servers,
        'resource' => $resource,
    ]);
}

}