<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Inertia\Inertia;
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