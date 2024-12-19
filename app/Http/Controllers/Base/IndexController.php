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
        $this->middleware('auth')->except(['index', 'dashboard']);
    }

    public function index(): RedirectResponse
    {
        if (Auth::check()) {
            return redirect('/dashboard');
        }
        
        return redirect('/auth/login');
    }

    public function dashboard(Request $request): Response
    {
        if (!Auth::check()) {
            return redirect('/auth/login'); // Or your home route
        }

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => Auth::user() ? [
                    'uuid' => Auth::user()->uuid,
                    'username' => Auth::user()->username,
                    'email' => Auth::user()->email,
                    'rootAdmin' => Auth::user()->root_admin,
                    'useTotp' => Auth::user()->use_totp,
                    'language' => Auth::user()->language,
                ] : null,
            ]
        ]);
    }
}