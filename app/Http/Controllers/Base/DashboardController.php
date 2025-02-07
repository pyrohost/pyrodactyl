<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use Inertia\Inertia;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Plan;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Location;
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
        $user = auth()->user();
        $activePlanName = $user->purchases_plans['Free Tier']['name'] ?? null;
        
        if (!$activePlanName) {
            throw new DisplayException('No active plan found');
        }

        $plan = \Pterodactyl\Models\Plan::where('name', $activePlanName)->first();
        
        if (!$plan) {
            throw new DisplayException('Plan not found in database');
        }

        $locations = Location::with(['nodes' => function($query) {
            $query->select(['id', 'name', 'location_id'])
                ->where('public', true);
        }])->get()->filter(function($location) use ($activePlanName) {
            return $location->nodes->count() > 0 
                && $location->userHasRequiredPlan([$activePlanName])
                && !$location->hasReachedMaximumServers();
        });

        $eggs = Nest::with(['eggs' => function($query) {
            $query->whereRaw("LOWER(description) LIKE '%server_ready%'")
                ->select(['id', 'nest_id', 'name', 'description', 'image_url']);
        }])->get()->pluck('eggs')->flatten();

        return Inertia::render('Dash/Deploy/ServerCreate', [
            'plan' => $plan,
            'limits' => [
                'cpu' => $plan->cpu,
                'memory' => $plan->memory,
                'disk' => $plan->disk,
                'servers' => $plan->servers,
                'allocations' => $plan->allocations,
                'databases' => $plan->databases,
                'backups' => $plan->backups
            ],
            'locations' => $locations,
            'eggs' => $eggs
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