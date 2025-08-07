<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;

class StartupCommandUpdateService
{
    public function __construct(
        private ConnectionInterface $connection,
        private DaemonServerRepository $daemonServerRepository,
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

            // Sync the server configuration with Wings daemon
            $this->daemonServerRepository->setServer($server)->sync();

            return $server->refresh();
        });
    }
}