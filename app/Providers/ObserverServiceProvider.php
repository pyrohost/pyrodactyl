<?php

namespace Pterodactyl\Providers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Models\SessionActivity;
use Pterodactyl\Observers\EggObserver;
use Pterodactyl\Observers\UserObserver;
use Pterodactyl\Observers\ServerObserver;
use Pterodactyl\Observers\SubuserObserver;
use Pterodactyl\Observers\AllocationObserver;
use Pterodactyl\Observers\EggVariableObserver;
use Pterodactyl\Observers\SessionActivityObserver;
use Illuminate\Support\ServiceProvider;

class ObserverServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(UserObserver::class);
        Server::observe(ServerObserver::class);
        Subuser::observe(SubuserObserver::class);
        Allocation::observe(AllocationObserver::class);
        Egg::observe(EggObserver::class);
        EggVariable::observe(EggVariableObserver::class);
        SessionActivity::observe(SessionActivityObserver::class);
    }
}