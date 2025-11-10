<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\ServerTransfer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonTransferRepository;

class TransferQueueService
{
    public function __construct(
        private DaemonTransferRepository $daemonTransferRepository,
    ) {
    }

    public function processQueue(): int
    {
        $activated = 0;

        $nodes = Node::all();

        foreach ($nodes as $node) {
            $activated += $this->processOutgoingForNode($node);
            $activated += $this->processIncomingForNode($node);
        }

        if ($activated > 0) {
            Log::info('Transfer queue processed', ['activated' => $activated]);
        }

        return $activated;
    }

    protected function processOutgoingForNode(Node $node): int
    {
        $activeCount = ServerTransfer::where('old_node', $node->id)
            ->where('queue_status', 'active')
            ->whereNull('successful')
            ->count();

        $capacity = $node->max_concurrent_outgoing_transfers - $activeCount;

        if ($capacity <= 0) {
            return 0;
        }

        $queued = ServerTransfer::where('old_node', $node->id)
            ->where('queue_status', 'queued')
            ->whereNull('successful')
            ->orderBy('priority', 'desc')
            ->orderBy('queued_at', 'asc')
            ->limit($capacity)
            ->lockForUpdate()
            ->get();

        $activated = 0;
        foreach ($queued as $transfer) {
            if ($this->activateTransfer($transfer)) {
                $activated++;
            }
        }

        return $activated;
    }

    protected function processIncomingForNode(Node $node): int
    {
        $activeCount = ServerTransfer::where('new_node', $node->id)
            ->where('queue_status', 'active')
            ->whereNull('successful')
            ->count();

        $capacity = $node->max_concurrent_incoming_transfers - $activeCount;

        if ($capacity <= 0) {
            return 0;
        }

        $queued = ServerTransfer::where('new_node', $node->id)
            ->where('queue_status', 'queued')
            ->whereNull('successful')
            ->whereNotIn('id', function ($query) {
                $query->select('id')
                    ->from('server_transfers')
                    ->where('queue_status', 'active')
                    ->whereNull('successful');
            })
            ->orderBy('priority', 'desc')
            ->orderBy('queued_at', 'asc')
            ->limit($capacity)
            ->lockForUpdate()
            ->get();

        $activated = 0;
        foreach ($queued as $transfer) {
            $outgoingNode = Node::find($transfer->old_node);
            if (!$outgoingNode) {
                continue;
            }

            $outgoingActiveCount = ServerTransfer::where('old_node', $outgoingNode->id)
                ->where('queue_status', 'active')
                ->whereNull('successful')
                ->count();

            if ($outgoingActiveCount >= $outgoingNode->max_concurrent_outgoing_transfers) {
                continue;
            }

            if ($this->activateTransfer($transfer)) {
                $activated++;
            }
        }

        return $activated;
    }

    protected function activateTransfer(ServerTransfer $transfer): bool
    {
        try {
            $existingTransfer = ServerTransfer::where('server_id', $transfer->server_id)
                ->where('id', '!=', $transfer->id)
                ->where('queue_status', 'active')
                ->whereNull('successful')
                ->exists();

            if ($existingTransfer) {
                Log::warning('Skipping transfer activation - server already has active transfer', [
                    'transfer_id' => $transfer->id,
                    'server_uuid' => $transfer->server->uuid,
                ]);
                return false;
            }

            DB::transaction(function () use ($transfer) {
                $transfer->update([
                    'queue_status' => 'active',
                    'activated_at' => now(),
                ]);

                $this->daemonTransferRepository
                    ->setServer($transfer->server)
                    ->notify($transfer->newNode, $transfer->token ?? '');
            });

            Log::info('Transfer activated from queue', [
                'transfer_id' => $transfer->id,
                'server_uuid' => $transfer->server->uuid,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to activate transfer from queue', [
                'transfer_id' => $transfer->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
