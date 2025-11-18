<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class RequireAdminPermission
{
    /**
     * Handle an incoming request and check for specific admin permissions.
     *
     * @throws AccessDeniedHttpException
     */
    public function handle(Request $request, Closure $next, string ...$permissions): mixed
    {
        $user = $request->user();

        if (!$user) {
            throw new AccessDeniedHttpException('You must be logged in to access this resource.');
        }

        // Root admins have access to everything
        if ($user->root_admin) {
            return $next($request);
        }

        // Check if user has any of the required permissions
        if (empty($permissions)) {
            // If no specific permissions specified, just check if they're any kind of admin
            if ($user->isAdmin()) {
                return $next($request);
            }
        } else {
            // Check if user has any of the specified permissions
            if ($user->hasAnyAdminPermission($permissions)) {
                return $next($request);
            }
        }

        throw new AccessDeniedHttpException('You do not have permission to access this resource.');
    }
}
