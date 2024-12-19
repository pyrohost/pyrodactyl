<?php
namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, ...$guards)


    /*
|--------------------------------------------------------------------------
| Why Does this Exist?
|--------------------------------------------------------------------------
|
| Well pterodactyl had this annoying Bullshit, Just keep it here 
| Removing it will break a lot of things 
| SImply, in the auth, until authenticated, it will keep redirecting 
|to the dashboard
|
*/


{
    \Log::debug('RedirectIfAuthenticated check', [
        'guards' => $guards,
        'authenticated' => Auth::check(),
        'intended_url' => $request->url(),
        'session' => $request->session()->all()
    ]);

    $guards = empty($guards) ? [null] : $guards;

    foreach ($guards as $guard) {
        if (Auth::guard($guard)->check()) {
            \Log::debug('User still authenticated, redirecting to dashboard jk doing nothing rn', [
                'guard' => $guard
            ]);
        
        }
    }

    \Log::debug('Allowing through RedirectIfAuthenticated');
    return null;
}
}