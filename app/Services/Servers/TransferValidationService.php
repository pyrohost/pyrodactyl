<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TransferValidationService
{
    public function validateTransfer(Server $server, Node $targetNode, array $allocations): array
    {
        $errors = [];
        $warnings = [];

        if (!$this->checkNodeReachable($server->node)) {
            $errors[] = "Source node '{$server->node->name}' is unreachable";
        }

        if (!$this->checkNodeReachable($targetNode)) {
            $errors[] = "Destination node '{$targetNode->name}' is unreachable";
        }

        if (empty($errors)) {
            $destinationCheck = $this->validateDestinationNode($server, $targetNode, $allocations);

            if (!$destinationCheck['success']) {
                $errors = array_merge($errors, $destinationCheck['errors'] ?? []);
            }

            if (!empty($destinationCheck['warnings'])) {
                $warnings = array_merge($warnings, $destinationCheck['warnings']);
            }
        }

        $activeOutgoing = $server->node->outgoingTransfers()->where('queue_status', 'active')->count();
        if ($activeOutgoing >= $server->node->max_concurrent_outgoing_transfers) {
            $warnings[] = "Source node is at maximum transfer capacity ({$activeOutgoing}/{$server->node->max_concurrent_outgoing_transfers}), transfer will be queued";
        }

        $activeIncoming = $targetNode->incomingTransfers()->where('queue_status', 'active')->count();
        if ($activeIncoming >= $targetNode->max_concurrent_incoming_transfers) {
            $warnings[] = "Destination node is at maximum transfer capacity ({$activeIncoming}/{$targetNode->max_concurrent_incoming_transfers}), transfer will be queued";
        }

        return [
            'success' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    protected function checkNodeReachable(Node $node): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $node->daemon_token,
                'Accept' => 'application/json',
            ])
            ->timeout(5)
            ->get($node->getConnectionAddress() . '/api/system');

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Node reachability check failed', [
                'node' => $node->name,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    protected function validateDestinationNode(Server $server, Node $targetNode, array $allocations): array
    {
        try {
            $allocationData = [];
            foreach ($allocations as $allocationId) {
                $allocation = \Pterodactyl\Models\Allocation::find($allocationId);
                if ($allocation) {
                    $allocationData[] = [
                        'ip' => $allocation->ip,
                        'port' => $allocation->port,
                    ];
                }
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $targetNode->daemon_token,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(10)
            ->post($targetNode->getConnectionAddress() . '/api/transfers/validate', [
                'server_uuid' => $server->uuid,
                'disk_mb' => $server->disk,
                'memory_mb' => $server->memory,
                'allocations' => $allocationData,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [
                'success' => false,
                'errors' => ['Failed to validate destination node: ' . $response->body()],
            ];
        } catch (\Exception $e) {
            Log::error('Destination validation failed', [
                'node' => $targetNode->name,
                'server' => $server->uuid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'errors' => ['Failed to validate destination node: ' . $e->getMessage()],
            ];
        }
    }
}
