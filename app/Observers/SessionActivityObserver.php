<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\SessionActivity;

class SessionActivityObserver
{
    /**
     * Handle the SessionActivity "creating" event.
     */
    public function creating(SessionActivity $sessionActivity): void
    {
        //
    }

    /**
     * Handle the SessionActivity "created" event.
     */
    public function created(SessionActivity $sessionActivity): void
    {
        //
    }

    /**
     * Handle the SessionActivity "updating" event.
     */
    public function updating(SessionActivity $sessionActivity): void
    {
        //
    }

    /**
     * Handle the SessionActivity "updated" event.
     */
    public function updated(SessionActivity $sessionActivity): void
    {
        //
    }

    /**
     * Handle the SessionActivity "deleting" event.
     */
    public function deleting(SessionActivity $sessionActivity): void
    {
        //
    }

    /**
     * Handle the SessionActivity "deleted" event.
     */
    public function deleted(SessionActivity $sessionActivity): void
    {
        //
    }
}