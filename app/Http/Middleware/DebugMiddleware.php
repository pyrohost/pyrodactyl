<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class DebugMiddleware
{
    public function handle($request, Closure $next)
    {
        $startTime = microtime(true);
        
        // Get detailed middleware info
        $route = $request->route();
        $middlewareStack = $route ? $route->gatherMiddleware() : [];
        
        // Get auth details
        $guards = array_keys(config('auth.guards'));
        $activeGuard = collect($guards)->first(function ($guard) {
            return Auth::guard($guard)->check();
        });

        $debug = [
            'Request' => [
                'path' => $request->path(),
                'method' => $request->method(),
                'time' => date('Y-m-d H:i:s'),
            ],
            'Authentication' => [
                'guard' => $activeGuard ?? 'none',
                'authenticated' => Auth::check(),
            ],
            'Middleware' => [
                'stack' => $middlewareStack,
                'groups' => app('router')->getMiddlewareGroups(),
                'aliases' => app('router')->getMiddleware(),
            ]
        ];

        Log::debug('Request Debug Information', $debug);
        
        $response = $next($request);
        
        $executionTime = microtime(true) - $startTime;
        Log::debug('Request completed in: ' . round($executionTime * 1000, 2) . 'ms');

        return $response;
    }
}