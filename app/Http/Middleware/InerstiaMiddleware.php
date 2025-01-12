<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class InerstiaMiddleware
{
    /**
     * Handle an incoming request.
     * This will come later, for now, just keep it here
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasHeader('X-Inertia')) {
            if (!Auth::check()) {
                abort(403, 'Unauthorized Inertia request.');
            }
        }

        return $next($request);
    }
}
