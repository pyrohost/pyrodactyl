<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
use Pterodactyl\Services\Games\GameRegistry;

class GameServiceProvider extends ServiceProvider
{
    /**
     * Register the game registry as a singleton.
     */
    public function register(): void
    {
        $this->app->singleton(GameRegistry::class, function () {
            return new GameRegistry();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}