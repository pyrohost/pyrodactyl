<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Pterodactyl\Services\Captcha\CaptchaManager;

class BladeServiceProvider extends ServiceProvider
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
        Blade::directive('captcha', function ($form) {
            return "<?php echo app('" . CaptchaManager::class . "')->getWidget($form); ?>";
        });

        Blade::if('captchaEnabled', function () {
            return app(CaptchaManager::class)->getDefaultDriver() !== 'none';
        });
    }
}
