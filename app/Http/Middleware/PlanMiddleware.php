<?php

namespace Petrodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\SuspensionService;
use App\Services\NotificationService;
use Carbon\Carbon;

class PlanMiddleware
{
    protected $suspensionService;
    protected $notificationService;

    // Make sure that after server is suspended to delete.
    // Make a cron job aswell so it checks for servers like this.
    // Also make sure to notify the user that the server has been suspended.
    // Add a rollback system to if the user has an extra plan or smthing it will rollback to that plan.
    


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