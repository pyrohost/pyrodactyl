<?php

namespace Pterodactyl\Observers;

use Pterodactyl\Models\Egg;

class EggObserver
{
    /**
     * Handle the Egg "creating" event.
     */
    public function creating(Egg $egg): void
    {
        //
    }

    /**
     * Handle the Egg "created" event.
     */
    public function created(Egg $egg): void
    {
        //
    }

    /**
     * Handle the Egg "updating" event.
     */
    public function updating(Egg $egg): void
    {
        //
    }

    /**
     * Handle the Egg "updated" event.
     */
    public function updated(Egg $egg): void
    {
        //
    }

    /**
     * Handle the Egg "deleting" event.
     */
    public function deleting(Egg $egg): void
    {
        //
    }

    /**
     * Handle the Egg "deleted" event.
     */
    public function deleted(Egg $egg): void
    {
        //
    }
}