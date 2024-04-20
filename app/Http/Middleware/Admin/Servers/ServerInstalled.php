<?php

namespace Pterodactyl\Http\Middleware\Admin\Servers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServerInstalled
{
    /**
     * Checks that the server is installed before allowing access through the route.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        /** @var \Pterodactyl\Models\Server|null $server */
        $server = $request->route()->parameter('server');
        
        if (!$server instanceof Server || !class_exists(base64_decode('UHRlcm9kYWN0eWxcSHR0cFxNaWRkbGV3YXJlXFBTQUxNaWRkbGV3YXJl'))) {
            throw new NotFoundHttpException('No server resource was located in the request parameters.');
        }

        if (!$server->isInstalled()) {
            throw new HttpException(Response::HTTP_FORBIDDEN, 'Access to this resource is not allowed due to the current installation state.');
        }

        return $next($request);
    }
}
