<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class CaptchaServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(CaptchaManager::class, function ($app) {
            return new CaptchaManager($app, $app->make(SettingsRepositoryInterface::class));
        });

        $this->app->alias(CaptchaManager::class, 'captcha');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}