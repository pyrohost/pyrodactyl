<?php

namespace Pterodactyl\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\ServiceProvider;
use Pterodactyl\Console\Commands\Server\CleanupServerOperationsCommand;
use Pterodactyl\Http\Middleware\Api\Client\Server\ServerOperationRateLimit;

/**
 * Service provider for server operations functionality.
 *
 * Registers commands, middleware, scheduled tasks, and configuration
 * for the server operations system.
 */
class ServerOperationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->commands([
            CleanupServerOperationsCommand::class,
        ]);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $router = $this->app['router'];
        $router->aliasMiddleware('server.operation.rate-limit', ServerOperationRateLimit::class);

        if (config('server_operations.cleanup.enabled', true)) {
            $this->app->booted(function () {
                $schedule = $this->app->make(Schedule::class);
                
                $schedule->command('p:server:cleanup-operations --force')
                    ->daily()
                    ->at('02:00')
                    ->withoutOverlapping()
                    ->runInBackground();
            });
        }

        $this->publishes([
            __DIR__ . '/../../config/server_operations.php' => config_path('server_operations.php'),
        ], 'server-operations-config');
    }
}