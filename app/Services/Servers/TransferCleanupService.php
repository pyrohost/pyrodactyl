<?php

namespace Pterodactyl\Services\Servers;

use Exception;
use Pterodactyl\Models\ServerTransfer;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class TransferCleanupService
{
    public function __construct(
        private DaemonServerRepository $daemonServerRepository,
    ) {
    }

    public function cleanupSourceNode(ServerTransfer $transfer): bool
    {
        $retries = [5, 30, 300];

        for ($attempt = 0; $attempt < count($retries); $attempt++) {
            try {
                $this->daemonServerRepository
                    ->setServer($transfer->server)
                    ->setNode($transfer->oldNode)
                    ->delete();

                Log::info('Source node cleanup succeeded', [
                    'transfer_id' => $transfer->id,
                    'server_uuid' => $transfer->server->uuid,
                    'attempt' => $attempt + 1,
                ]);

                return true;
            } catch (DaemonConnectionException $e) {
                Log::warning('Source node cleanup failed', [
                    'transfer_id' => $transfer->id,
                    'server_uuid' => $transfer->server->uuid,
                    'attempt' => $attempt + 1,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt < count($retries) - 1) {
                    sleep($retries[$attempt]);
                }
            } catch (Exception $e) {
                Log::warning('Source node cleanup failed with unexpected error', [
                    'transfer_id' => $transfer->id,
                    'server_uuid' => $transfer->server->uuid,
                    'attempt' => $attempt + 1,
                    'error' => $e->getMessage(),
                ]);

                if ($attempt < count($retries) - 1) {
                    sleep($retries[$attempt]);
                }
            }
        }

        $this->queueOrphanedServerCleanup($transfer);

        return false;
    }

    protected function queueOrphanedServerCleanup(ServerTransfer $transfer): void
    {
        Log::warning('Queueing orphaned server for background cleanup', [
            'transfer_id' => $transfer->id,
            'server_uuid' => $transfer->server->uuid,
            'node_id' => $transfer->old_node,
        ]);
    }
}
