<?php

namespace Pterodactyl\Http\Controllers\Api\Remote\Backups;

use Illuminate\Http\Request;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Exceptions\Http\HttpForbiddenException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class BackupSizeController extends Controller
{
    /**
     * Updates backup sizes after deduplication recalculation from Elytra.
     * This endpoint is called when Rustic backups are deleted and remaining
     * backup sizes need to be recalculated to account for deduplication.
     */
    public function update(Request $request, string $uuid): JsonResponse
    {
        // Get the node associated with the request
        /** @var \Pterodactyl\Models\Node $node */
        $node = $request->attributes->get('node');

        // Find the server
        /** @var Server $server */
        $server = Server::query()
            ->where('uuid', $uuid)
            ->firstOrFail();

        // Check that the server belongs to the node making the request
        if ($server->node_id !== $node->id) {
            throw new HttpForbiddenException('You do not have permission to access that server.');
        }

        // Validate the request data
        $validatedData = $request->validate([
            'server_uuid' => ['required', 'string', Rule::in([$uuid])],
            'backups' => ['required', 'array', 'min:1'],
            'backups.*.backup_uuid' => ['required', 'string', 'uuid'],
            'backups.*.new_size' => ['required', 'integer', 'min:0'],
        ]);

        $updatedCount = 0;
        $errors = [];
        $backupsToUpdate = [];

        // First pass: validate all backups and prepare updates
        foreach ($validatedData['backups'] as $backupData) {
            /** @var Backup $backup */
            $backup = Backup::query()
                ->where('uuid', $backupData['backup_uuid'])
                ->where('server_id', $server->id)
                ->first();

            if (!$backup) {
                $errors[] = [
                    'backup_uuid' => $backupData['backup_uuid'],
                    'error' => 'Backup not found or does not belong to this server'
                ];
                continue;
            }

            // Only update successful backups
            if (!$backup->is_successful) {
                $errors[] = [
                    'backup_uuid' => $backupData['backup_uuid'],
                    'error' => 'Cannot update size of unsuccessful backup'
                ];
                continue;
            }

            $backupsToUpdate[] = [
                'backup' => $backup,
                'old_size' => $backup->bytes,
                'new_size' => $backupData['new_size'],
            ];
        }

        // If we have validation errors but some backups can be updated, proceed with partial update
        // If ALL backups failed validation, return early without making any changes
        if (empty($backupsToUpdate)) {
            return new JsonResponse([
                'updated_count' => 0,
                'total_requested' => count($validatedData['backups']),
                'errors' => $errors,
            ], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Second pass: perform all updates in a transaction for atomicity
        try {
            \DB::transaction(function () use ($backupsToUpdate, &$updatedCount, $server) {
                foreach ($backupsToUpdate as $updateData) {
                    $backup = $updateData['backup'];
                    $oldSize = $updateData['old_size'];
                    $newSize = $updateData['new_size'];

                    $backup->update(['bytes' => $newSize]);
                    $updatedCount++;

                    \Log::info('Updated backup size after deduplication recalculation', [
                        'backup_uuid' => $backup->uuid,
                        'server_uuid' => $server->uuid,
                        'old_size' => $oldSize,
                        'new_size' => $newSize,
                        'size_difference' => $newSize - $oldSize,
                    ]);
                }
            });
        } catch (\Exception $e) {
            \Log::error('Failed to update backup sizes in transaction', [
                'server_uuid' => $server->uuid,
                'error' => $e->getMessage(),
            ]);

            return new JsonResponse([
                'updated_count' => 0,
                'total_requested' => count($validatedData['backups']),
                'errors' => [['error' => 'Transaction failed: ' . $e->getMessage()]],
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }

        \Log::info('Backup size recalculation completed', [
            'server_uuid' => $server->uuid,
            'total_backups' => count($validatedData['backups']),
            'updated_count' => $updatedCount,
            'error_count' => count($errors),
        ]);

        $responseData = [
            'updated_count' => $updatedCount,
            'total_requested' => count($validatedData['backups']),
        ];

        if (!empty($errors)) {
            $responseData['errors'] = $errors;
        }

        $statusCode = $updatedCount > 0 ? JsonResponse::HTTP_OK : JsonResponse::HTTP_BAD_REQUEST;
        return new JsonResponse($responseData, $statusCode);
    }
}