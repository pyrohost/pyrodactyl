<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
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
        // No commands to register currently
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $router = $this->app['router'];
        $router->aliasMiddleware('server.operation.rate-limit', ServerOperationRateLimit::class);

        $this->publishes([
            __DIR__ . '/../../config/server_operations.php' => config_path('server_operations.php'),
        ], 'server-operations-config');
    }
}