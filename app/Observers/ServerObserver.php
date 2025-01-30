<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\Server;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Pterodactyl\Events;

class ServerObserver
{
    use DispatchesJobs;

    /**
     * Listen to the Server creating event.
     */
    public function creating(Server $server): void
    {
        event(new Events\Server\Creating($server));
    }

    /**
     * Listen to the Server created event.
     */
    public function created(Server $server): void
    {
        event(new Events\Server\Created($server));
        
        if ($server->owner) {
            $server->owner->updateResourceUsage();
        }
    }

    /**
     * Listen to the Server deleting event.
     */
    public function deleting(Server $server): void
    {
        event(new Events\Server\Deleting($server));
    }

    /**
     * Listen to the Server deleted event.
     */
    public function deleted(Server $server): void
    {
        if ($server->owner) {
            $server->owner->updateResourceUsage();
        }
    }

    /**
     * Listen to the Server updated event.
     */
    public function updated(Server $server): void
    {
        if ($server->owner) {
            $server->owner->updateResourceUsage();
        }
    }
}