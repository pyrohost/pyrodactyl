<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AdminAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        $user = $request->user();
        
        if (!$user) {
            throw new AccessDeniedHttpException('Authentication required.');
        }

        // Check if user is either a root admin or has any admin permissions
        if (!$user->root_admin && !$user->isAdmin()) {
            throw new AccessDeniedHttpException('Admin access required.');
        }

        return $next($request);
    }
}
