<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Pterodactyl\Services\Servers\SuspensionService;
use Pterodactyl\Services\Notifications\NotificationService;
use Carbon\Carbon;

class PlanCheckMiddleware
{
    protected $suspensionService;
    protected $notificationService;

    public function __construct(SuspensionService $suspensionService, NotificationService $notificationService)
    {
        $this->suspensionService = $suspensionService;
        $this->notificationService = $notificationService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $server = $request->route('server');

        if ($server && isset($server->plan)) {
            $plan = $server->plan;

            if (isset($plan['expires_at']) && Carbon::parse($plan['expires_at'])->isPast()) {
                // Suspend the server
                $this->suspensionService->toggle($server, SuspensionService::ACTION_SUSPEND);

                // Notify the user
                $this->notificationService->notify(
                    $request->user()->id,
                    'Server Suspended Due to Expired Plan',
                    'This plan is expired for this server',
                    null,
                    'warning'
                );
            }
        }

        return $next($request);
    }
}