<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\ServerTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupStaleTransfersCommand extends Command
{
    protected $signature = 'p:transfer:cleanup';

    protected $description = 'Cleanup stale server transfers that have exceeded their timeout';

    public function handle(): int
    {
        $staleTransfers = ServerTransfer::whereNull('successful')
            ->where(function ($query) {
                $query->where('started_at', '<', DB::raw('DATE_SUB(NOW(), INTERVAL timeout_hours HOUR)'))
                    ->orWhere(function ($q) {
                        $q->whereNotNull('last_heartbeat_at')
                          ->where('last_heartbeat_at', '<', DB::raw('DATE_SUB(NOW(), INTERVAL 15 MINUTE)'));
                    });
            })
            ->with(['server', 'oldNode', 'newNode'])
            ->get();

        if ($staleTransfers->isEmpty()) {
            $this->info('No stale transfers found.');
            return 0;
        }

        $this->info('Found ' . $staleTransfers->count() . ' stale transfer(s).');

        foreach ($staleTransfers as $transfer) {
            try {
                DB::transaction(function () use ($transfer) {
                    $transfer->update(['successful' => false]);

                    $allocations = array_merge([$transfer->new_allocation], $transfer->new_additional_allocations ?? []);
                    Allocation::query()->whereIn('id', $allocations)->update(['server_id' => null]);

                    $oldAllocations = array_merge([$transfer->old_allocation], $transfer->old_additional_allocations ?? []);
                    Allocation::query()->whereIn('id', $oldAllocations)
                        ->where('server_id', null)
                        ->update(['server_id' => $transfer->server_id]);
                });

                Log::warning('Cleaned up stale transfer', [
                    'transfer_id' => $transfer->id,
                    'server_id' => $transfer->server_id,
                    'server_uuid' => $transfer->server->uuid,
                    'started_at' => $transfer->started_at,
                    'last_heartbeat_at' => $transfer->last_heartbeat_at,
                ]);

                $this->warn('Marked transfer ' . $transfer->id . ' for server ' . $transfer->server->uuid . ' as failed (timeout)');
            } catch (\Exception $e) {
                Log::error('Failed to cleanup stale transfer', [
                    'transfer_id' => $transfer->id,
                    'error' => $e->getMessage(),
                ]);

                $this->error('Failed to cleanup transfer ' . $transfer->id . ': ' . $e->getMessage());
            }
        }

        return 0;
    }
}
