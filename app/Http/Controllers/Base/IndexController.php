<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controller;
use Illuminate\Http\RedirectResponse;

class IndexController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index']);
    }

    public function index(): RedirectResponse
    {
        return redirect('/auth/login');
    }

    public function dashboard(Request $request): Response
    {
        if (!Auth::check()) {
            return Inertia::render('Errors/NoAuth');
        }

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    }
}