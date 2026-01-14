<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckDaemonType
{
    public function handle(Request $request, Closure $next, string $daemon)
    {
        $server = $request->attributes->get('server');
        $daemonType = $server->node->daemonType;

        if (! $daemonType) {
            abort(404);
        }

        if ($daemonType !== $daemon) {
            abort(400, "This endpoint requires daemon type '{$daemon}', but server is using '{$daemonType}'.");
        }

        return $next($request);
    }
}
