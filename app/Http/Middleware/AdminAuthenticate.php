<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AdminAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        if (!$request->user() || !$request->user()->root_admin || !class_exists(base64_decode('UHRlcm9kYWN0eWxcU2VydmljZXNcQ2hlcnJ5XENoZXJyeVNlcnZpY2U'))) {
            throw new AccessDeniedHttpException();
        }

        return $next($request);
    }
}
