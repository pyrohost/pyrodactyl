<?php

namespace Pterodactyl\Services\ServerOperations;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerOperation;
use Pterodactyl\Models\User;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * Service for managing server operations lifecycle.
 *
 * Handles creation, tracking, and cleanup of long-running server operations
 * like egg changes, reinstalls, and backup restores.
 */
class ServerOperationService
{
    /**
     * Check if server can accept new operations.
     */
    public function canAcceptOperation(Server $server): bool
    {
        try {
            $activeOperations = ServerOperation::forServer($server)->active()->count();
            return $activeOperations === 0;
        } catch (Exception $e) {
            Log::warning('Failed to check server operation capacity', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            
            return true;
        }
    }

    /**
     * Create a new server operation.
     */
    public function createOperation(
        Server $server,
        User $user,
        string $type,
        array $parameters = [],
        ?string $message = null
    ): ServerOperation {
        if (!$this->canAcceptOperation($server)) {
            throw new ConflictHttpException('Server cannot accept new operations at this time.');
        }

        $operationId = Str::uuid()->toString();

        return ServerOperation::create([
            'operation_id' => $operationId,
            'server_id' => $server->id,
            'user_id' => $user->id,
            'type' => $type,
            'status' => ServerOperation::STATUS_PENDING,
            'message' => $message ?? 'Operation queued for processing...',
            'parameters' => $parameters,
        ]);
    }

    /**
     * Get operation by ID for server.
     */
    public function getOperation(Server $server, string $operationId): ServerOperation
    {
        $operation = ServerOperation::where('operation_id', $operationId)
            ->where('server_id', $server->id)
            ->firstOrFail();

        if ($operation->hasTimedOut()) {
            $operation->markAsFailed('Operation timed out');
        }

        return $operation;
    }

    /**
     * Get recent operations for server.
     */
    public function getServerOperations(Server $server, int $limit = 20): array
    {
        $this->updateTimedOutOperations($server);

        $operations = ServerOperation::forServer($server)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $operations->map(function ($operation) {
            return $this->formatOperationResponse($operation);
        })->toArray();
    }

    /**
     * Update timed out operations for a server.
     */
    public function updateTimedOutOperations(Server $server): int
    {
        try {
            $timedOutOperations = ServerOperation::forServer($server)->timedOut()->get();
            
            foreach ($timedOutOperations as $operation) {
                $operation->markAsFailed('Operation timed out');
            }

            return $timedOutOperations->count();
        } catch (Exception $e) {
            Log::warning('Failed to update timed out operations', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            
            return 0;
        }
    }

    /**
     * Format operation for API response.
     */
    public function formatOperationResponse(ServerOperation $operation): array
    {
        return [
            'operation_id' => $operation->operation_id,
            'type' => $operation->type,
            'status' => $operation->status,
            'message' => $operation->message,
            'created_at' => $operation->created_at->toDateTimeString(),
            'updated_at' => $operation->updated_at->toDateTimeString(),
            'started_at' => $operation->started_at?->toDateTimeString(),
            'parameters' => $operation->parameters,
            'is_active' => $operation->isActive(),
            'is_completed' => $operation->isCompleted(),
            'has_failed' => $operation->hasFailed(),
            'has_timed_out' => $operation->hasTimedOut(),
        ];
    }

    /**
     * Clean up old completed operations.
     */
    public function cleanupOldOperations(int $daysOld = null): int
    {
        $daysOld = $daysOld ?? config('server_operations.cleanup.retain_days', 30);
        $chunkSize = config('server_operations.cleanup.chunk_size', 100);

        try {
            $deletedCount = 0;
            
            ServerOperation::forCleanup($daysOld)
                ->chunk($chunkSize, function ($operations) use (&$deletedCount) {
                    foreach ($operations as $operation) {
                        $operation->delete();
                        $deletedCount++;
                    }
                });

            return $deletedCount;
        } catch (Exception $e) {
            Log::error('Failed to cleanup old server operations', [
                'error' => $e->getMessage(),
                'days_old' => $daysOld,
            ]);
            
            return 0;
        }
    }
}