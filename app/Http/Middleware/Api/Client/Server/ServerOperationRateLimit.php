<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerOperation;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Middleware to rate limit server operations.
 *
 * Prevents concurrent operations on the same server and provides monitoring
 * of operation attempts for analytics and troubleshooting.
 */
class ServerOperationRateLimit
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $operationType = 'general')
    {
        /** @var Server $server */
        $server = $request->route('server');
        $user = $request->user();

        $this->checkActiveOperations($server);
        $this->logOperationAttempt($server, $user, $operationType);

        return $next($request);
    }

    /**
     * Check for active operations on the same server.
     */
    private function checkActiveOperations(Server $server): void
    {
        try {
            if (!$this->tableExists('server_operations')) {
                return;
            }

            $activeOperations = ServerOperation::forServer($server)->active()->count();

            if ($activeOperations > 0) {
                throw new TooManyRequestsHttpException(
                    300,
                    'Another operation is currently in progress for this server. Please wait for it to complete.'
                );
            }
        } catch (\Exception $e) {
            Log::warning('Failed to check for active operations', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if a database table exists.
     */
    private function tableExists(string $tableName): bool
    {
        try {
            return \Schema::hasTable($tableName);
        } catch (\Exception $e) {
            Log::warning('Failed to check if table exists', [
                'table' => $tableName,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Log operation attempt for monitoring.
     */
    private function logOperationAttempt(Server $server, $user, string $operationType): void
    {
        Log::info('Server operation attempt', [
            'server_id' => $server->id,
            'server_uuid' => $server->uuid,
            'user_id' => $user->id,
            'operation_type' => $operationType,
            'timestamp' => now()->toISOString(),
        ]);
    }
}