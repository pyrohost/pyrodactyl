<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class StartupCommandUpdateService
{
    public function __construct(
        private ConnectionInterface $connection,
        private DaemonConfigurationRepository $daemonConfigurationRepository,
        private ServerConfigurationStructureService $configurationStructureService,
    ) {
    }

    /**
     * Updates the startup command for a server and syncs the configuration with Wings.
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     * @throws \Throwable
     */
    public function handle(Server $server, string $startup): Server
    {
        $original = $server->startup;

        return $this->connection->transaction(function () use ($server, $startup, $original) {
            $server->update(['startup' => $startup]);

            // Log the activity
            Activity::event('server:startup.command')
                ->subject($server)
                ->property([
                    'old' => $original,
                    'new' => $startup,
                ])
                ->log();

            // Update the daemon configuration
            $this->daemonConfigurationRepository->setServer($server)->update(
                $this->configurationStructureService->handle($server)
            );

            return $server->refresh();
        });
    }
}