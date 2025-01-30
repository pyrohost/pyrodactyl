<?php

namespace Petrodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Petrodactyl\Models\PastelKey;

class PastelKeyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $bearer = $request->bearerToken();
        
        if (!$bearer) {
            return response()->json(['error' => 'No Pastel key provided'], 401);
        }

        $key = PastelKey::where('identifier', $bearer)->first();
        
        if (!$key) {
            return response()->json(['error' => 'Invalid Pastel key'], 401);
        }

        if ($key->expires_at && now()->gt($key->expires_at)) {
            return response()->json(['error' => 'Pastel key expired'], 401);
        }

        // Check IP restrictions
        if ($key->allowed_ips && !in_array($request->ip(), $key->allowed_ips)) {
            return response()->json(['error' => 'IP not allowed'], 403);
        }

        // Check permissions for route
        $resource = $this->getResourceFromRoute($request->route()->getName());
        if (!$key->hasPermission($resource, PastelKey::READ)) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        $key->update(['last_used_at' => now()]);
        return $next($request);
    }

    private function getResourceFromRoute($routeName)
    {
        $map = [
            'api.users' => AdminAcl::RESOURCE_USERS,
            'api.servers' => AdminAcl::RESOURCE_SERVERS,
            // Add more mappings
        ];

        return $map[$routeName] ?? null;
    }
}