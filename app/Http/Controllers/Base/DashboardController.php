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
}