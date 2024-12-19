<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class LogoutController extends Controller
{
    /**
     * Log the user out of the application.
     */
    public function logout(Request $request) 
{
    \Log::debug('Logout initiated', [
        'user' => Auth::id(),
        'authenticated' => Auth::check()
    ]);

    Auth::logout();
    
    $request->session()->flush();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    \Log::debug('After logout checks', [
        'authenticated' => Auth::check(),
        'session_status' => $request->session()->all()
    ]);

    return redirect('/auth/login');
}
}