<?php

namespace Pterodactyl\Services\Elytra\Jobs;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ElytraJob;
use Pterodactyl\Models\Permission;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Pterodactyl\Contracts\Elytra\Job;
use Pterodactyl\Repositories\Elytra\ElytraRepository;
use Pterodactyl\Services\Backups\ServerStateService;
use Pterodactyl\Services\Backups\DownloadLinkService;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Transformers\Api\Client\BackupTransformer;

class BackupJob implements Job
{
    public function __construct(
        private ServerStateService $serverStateService,
        private BackupTransformer $backupTransformer,
        private DownloadLinkService $downloadLinkService,
        private BackupManager $backupManager,
    ) {}

    public static function getSupportedJobTypes(): array
    {
        return ['backup_create', 'backup_delete', 'backup_restore', 'backup_download', 'backup_delete_all'];
    }

    public function getRequiredPermissions(string $operation): array
    {
        return match ($operation) {
            'index' => [Permission::ACTION_BACKUP_READ],
            'create' => [Permission::ACTION_BACKUP_CREATE],
            'show' => [Permission::ACTION_BACKUP_READ],
            'cancel' => [Permission::ACTION_BACKUP_DELETE],
            default => [],
        };
    }

    public function validateJobData(array $jobData): array
    {
        $rules = match ($jobData['operation'] ?? '') {
            'create' => [
                'operation' => 'required|string|in:create',
                'adapter' => 'nullable|string',
                'ignored' => 'nullable|string',
                'name' => 'nullable|string|max:255',
                'is_automatic' => 'nullable|boolean',
            ],
            'delete' => [
                'operation' => 'required|string|in:delete',
                'backup_uuid' => 'required|string|uuid',
                'snapshot_id' => 'nullable|string',
            ],
            'restore' => [
                'operation' => 'required|string|in:restore',
                'backup_uuid' => 'required|string|uuid',
                'snapshot_id' => 'nullable|string',
                'truncate_directory' => 'boolean',
            ],
            'download' => [
                'operation' => 'required|string|in:download',
                'backup_uuid' => 'required|string|uuid',
            ],
            'delete_all' => [
                'operation' => 'required|string|in:delete_all',
            ],
            default => throw new \Exception('Invalid or missing operation'),
        };

        $validator = Validator::make($jobData, $rules);

        if ($validator->fails()) {
            throw new \Exception('Invalid job data: ' . implode(', ', $validator->errors()->all()));
        }

        return $validator->validated();
    }

    public function submitToElytra(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        $jobData = $job->job_data;
        $operation = $jobData['operation'];

        return match ($operation) {
            'create' => $this->submitCreateJob($server, $job, $elytraRepository),
            'delete' => $this->submitDeleteJob($server, $job, $elytraRepository),
            'restore' => $this->submitRestoreJob($server, $job, $elytraRepository),
            'download' => $this->submitDownloadJob($server, $job, $elytraRepository),
            'delete_all' => $this->submitDeleteAllJob($server, $job, $elytraRepository),
            default => throw new \Exception("Unsupported backup operation: {$operation}"),
        };
    }

    public function cancelOnElytra(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): void
    {
        if (!$job->elytra_job_id) {
            throw new \Exception('No Elytra job ID to cancel');
        }

        $elytraRepository->setServer($server)->cancelJob($job->elytra_job_id);
    }

    public function processStatusUpdate(ElytraJob $job, array $statusData): void
    {
        $successful = $statusData['successful'] ?? false;
        $jobType = $statusData['job_type'] ?? '';
        $operation = $this->getOperationFromJobType($jobType);

        Log::debug("processStatusUpdate called", [
            'job_id' => $job->id,
            'job_type' => $jobType,
            'operation' => $operation,
            'successful' => $successful,
            'has_repository_size' => isset($statusData['repository_size']),
        ]);

        $errorMessage = $successful ? null : ($statusData['error_message'] ?? 'Unknown error');
        if ($errorMessage) {
            $errorMessage = $this->sanitizeBackupError($errorMessage);
        }

        $job->update([
            'status' => $successful ? ElytraJob::STATUS_COMPLETED : ElytraJob::STATUS_FAILED,
            'progress' => $successful ? 100 : $job->progress,
            'status_message' => $statusData['message'] ?? ($successful ? 'Completed successfully' : 'Failed'),
            'error_message' => $errorMessage,
            'completed_at' => CarbonImmutable::now(),
        ]);

        match ($operation) {
            'create' => $this->handleCreateCompletion($job, $statusData),
            'delete' => $this->handleDeleteCompletion($job, $statusData),
            'restore' => $this->handleRestoreCompletion($job, $statusData),
            'download' => $this->handleDownloadCompletion($job, $statusData),
            'delete_all' => $this->handleDeleteAllCompletion($job, $statusData),
            default => Log::warning("Unknown backup operation for status update: {$operation}"),
        };
    }

    public function formatJobResponse(ElytraJob $job): array
    {
        $jobData = $job->job_data;
        $operation = $jobData['operation'] ?? 'unknown';

        $response = [
            'operation' => $operation,
        ];

        if (isset($jobData['backup_uuid'])) {
            $backup = Backup::where('uuid', $jobData['backup_uuid'])->first();
            if ($backup) {
                $response['backup'] = $this->backupTransformer->transform($backup);
            }
        }

        match ($operation) {
            'create' => $response = array_merge($response, [
                'adapter' => $jobData['adapter'] ?? null,
                'ignored' => $jobData['ignored'] ?? null,
                'name' => $jobData['name'] ?? null,
            ]),
            'restore' => $response = array_merge($response, [
                'truncate_directory' => $jobData['truncate_directory'] ?? false,
            ]),
            default => null,
        };

        return $response;
    }

    private function submitCreateJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        $jobData = $job->job_data;

        $backupUuid = $this->generateBackupUuid();

        $job->update([
            'job_data' => array_merge($jobData, ['backup_uuid' => $backupUuid]),
        ]);

        $elytraJobData = [
            'server_id' => $server->uuid,
            'backup_uuid' => $backupUuid,
            'name' => $jobData['name'] ?? $this->generateBackupName(),
            'ignore' => $jobData['ignored'] ?? '',
            'adapter_type' => $jobData['adapter'] ?? 'elytra',
        ];

        Log::info("Submitting backup creation job to Elytra", [
            'server_id' => $server->id,
            'backup_uuid' => $backupUuid,
            'job_data' => $elytraJobData,
        ]);

        $response = $elytraRepository->setServer($server)->createJob('backup_create', $elytraJobData);

        return $response['job_id'] ?? throw new \Exception('No job ID returned from Elytra');
    }

    private function submitDeleteJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        $jobData = $job->job_data;
        $backup = Backup::where('uuid', $jobData['backup_uuid'])->firstOrFail();

        $elytraJobData = [
            'server_id' => $server->uuid,
            'backup_uuid' => $backup->uuid,
            'snapshot_id' => $backup->snapshot_id,
            'adapter_type' => $backup->getElytraAdapterType(),
        ];

        $response = $elytraRepository->setServer($server)->createJob('backup_delete', $elytraJobData);

        return $response['job_id'] ?? throw new \Exception('No job ID returned from Elytra');
    }

    private function submitRestoreJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        $jobData = $job->job_data;
        $backup = Backup::where('uuid', $jobData['backup_uuid'])->firstOrFail();

        $downloadUrl = $jobData['download_url'] ?? null;

        if ($backup->disk === Backup::ADAPTER_AWS_S3 && empty($downloadUrl)) {
            try {
                $downloadUrl = $this->generateS3DownloadUrl($backup);
            } catch (\Exception $e) {
                Log::error('Failed to generate S3 download URL for backup restoration', [
                    'backup_uuid' => $backup->uuid,
                    'error' => $e->getMessage(),
                ]);
                throw new \Exception('Failed to generate S3 download URL: ' . $e->getMessage());
            }
        }

        $elytraJobData = [
            'server_id' => $server->uuid,
            'backup_uuid' => $backup->uuid,
            'snapshot_id' => $backup->snapshot_id,
            'adapter_type' => $backup->getElytraAdapterType(),
            'truncate_directory' => $jobData['truncate_directory'] ?? false,
            'download_url' => $downloadUrl,
        ];

        $response = $elytraRepository->setServer($server)->createJob('backup_restore', $elytraJobData);

        return $response['job_id'] ?? throw new \Exception('No job ID returned from Elytra');
    }

    private function submitDownloadJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        throw new \Exception('Download jobs not yet implemented');
    }

    private function handleCreateCompletion(ElytraJob $job, array $statusData): void
    {
        $jobData = $job->job_data;
        $backupUuid = $jobData['backup_uuid'] ?? null;

        if (!$backupUuid) {
            Log::error("No backup UUID in job data for completed backup job", ['job_id' => $job->id]);
            return;
        }

        if ($statusData['successful']) {
            $server = $job->server;

            $actualAdapter = $this->mapElytraAdapterToModel($statusData['adapter'] ?? 'rustic_local');
            $isRusticBackup = in_array($actualAdapter, [Backup::ADAPTER_RUSTIC_LOCAL, Backup::ADAPTER_RUSTIC_S3]);

            $backupData = [
                'server_id' => $server->id,
                'uuid' => $backupUuid,
                'name' => $jobData['name'] ?? $this->generateBackupName(),
                'ignored_files' => $this->parseIgnoredFiles($jobData['ignored'] ?? ''),
                'disk' => $actualAdapter,
                'is_successful' => true,
                'is_locked' => false,
                'is_automatic' => $jobData['is_automatic'] ?? false,
                'checksum' => ($statusData['checksum_type'] ?? 'sha1') . ':' . ($statusData['checksum'] ?? ''),
                'bytes' => $statusData['size'] ?? 0,
                'snapshot_id' => $statusData['snapshot_id'] ?? null,
                'completed_at' => CarbonImmutable::now(),
            ];

            $serverState = null;
            try {
                $serverState = $this->serverStateService->captureServerState($server);
            } catch (\Exception $e) {
                Log::warning("Could not capture server state for backup", [
                    'backup_uuid' => $backupUuid,
                    'error' => $e->getMessage(),
                ]);
            }

            if ($serverState) {
                $backupData['server_state'] = $serverState;
            }

            $backup = Backup::create($backupData);

            if ($isRusticBackup && isset($statusData['repository_size'])) {
                $server->update(['repository_backup_bytes' => $statusData['repository_size']]);

                Log::info("Backup record created successfully (rustic)", [
                    'backup_id' => $backup->id,
                    'backup_uuid' => $backup->uuid,
                    'disk' => $backup->disk,
                    'repository_size_mb' => round($statusData['repository_size'] / 1024 / 1024, 2),
                ]);
            } else {
                Log::info("Backup record created successfully", [
                    'backup_id' => $backup->id,
                    'backup_uuid' => $backup->uuid,
                    'disk' => $backup->disk,
                    'size_mb' => round($backup->bytes / 1024 / 1024, 2),
                ]);
            }

            if ($backup->is_automatic) {
                $this->pruneOldAutomaticBackups($server);
            }
        } else {
            Log::error("Backup job failed", [
                'backup_uuid' => $backupUuid,
                'error' => $statusData['error_message'] ?? 'Unknown error',
                'job_id' => $job->id,
            ]);
        }
    }

    private function handleDeleteCompletion(ElytraJob $job, array $statusData): void
    {
        Log::debug("handleDeleteCompletion called", [
            'job_id' => $job->id,
            'statusData' => $statusData,
        ]);

        if ($statusData['successful']) {
            $jobData = $job->job_data;
            $backup = Backup::where('uuid', $jobData['backup_uuid'])->first();

            if ($backup) {
                $server = $backup->server;
                $isRusticBackup = in_array($backup->disk, [Backup::ADAPTER_RUSTIC_LOCAL, Backup::ADAPTER_RUSTIC_S3]);

                Log::debug("Backup found for deletion", [
                    'backup_uuid' => $backup->uuid,
                    'disk' => $backup->disk,
                    'is_rustic' => $isRusticBackup,
                    'has_repository_size' => isset($statusData['repository_size']),
                ]);

                $backup->delete();

                // If this was a rustic backup and we got the updated repository size, update the server
                if ($isRusticBackup && isset($statusData['repository_size'])) {
                    $server->update(['repository_backup_bytes' => $statusData['repository_size']]);

                    Log::info("Updated repository size after backup deletion", [
                        'server_uuid' => $server->uuid,
                        'repository_size_mb' => round($statusData['repository_size'] / 1024 / 1024, 2),
                        'adapter_type' => $backup->disk,
                    ]);
                }
            }
        }
    }

    private function handleRestoreCompletion(ElytraJob $job, array $statusData): void {}

    private function handleDownloadCompletion(ElytraJob $job, array $statusData): void {}

    private function submitDeleteAllJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        // Get all backups for this server with necessary information
        $backups = $server->backups()->get(['uuid', 'disk', 'snapshot_id', 'checksum'])->map(function ($backup) {
            return [
                'uuid' => $backup->uuid,
                'adapter' => $backup->disk,
                'snapshot_id' => $backup->snapshot_id,
                'checksum' => $backup->checksum,
            ];
        })->toArray();

        $elytraJobData = [
            'server_id' => $server->uuid,
            'backups' => $backups,
        ];

        $response = $elytraRepository->setServer($server)->createJob('backup_delete_all', $elytraJobData);

        return $response['job_id'] ?? throw new \Exception('No job ID returned from Elytra');
    }

    private function handleDeleteAllCompletion(ElytraJob $job, array $statusData): void
    {
        if ($statusData['successful']) {
            $server = $job->server;

            $deletedCount = $server->backups()->delete();
            $server->update(['repository_backup_bytes' => 0]);

            Log::info("All backups deleted successfully", [
                'server_uuid' => $server->uuid,
                'deleted_count' => $deletedCount,
            ]);
        }
    }

    private function getOperationFromJobType(string $jobType): string
    {
        return match ($jobType) {
            'backup_create' => 'create',
            'backup_delete' => 'delete',
            'backup_restore' => 'restore',
            'backup_download' => 'download',
            'backup_delete_all' => 'delete_all',
            default => 'unknown',
        };
    }

    private function generateBackupUuid(): string
    {
        return (string) \Illuminate\Support\Str::uuid();
    }

    private function generateBackupName(): string
    {
        return 'Backup at ' . now()->format('Y-m-d Hi');
    }

    private function mapElytraAdapterToModel(string $elytraAdapter): string
    {
        return match ($elytraAdapter) {
            'elytra', 'local' => Backup::ADAPTER_RUSTIC_LOCAL,
            'rustic_local' => Backup::ADAPTER_RUSTIC_LOCAL,
            'rustic_s3' => Backup::ADAPTER_RUSTIC_S3,
            's3' => Backup::ADAPTER_RUSTIC_S3,
            'wings' => Backup::ADAPTER_WINGS,
            default => Backup::ADAPTER_RUSTIC_LOCAL,
        };
    }

    private function parseIgnoredFiles(string $ignored): array
    {
        if (empty($ignored)) {
            return [];
        }

        $files = array_filter(
            array_map('trim', explode("\n", $ignored)),
            fn($line) => !empty($line)
        );

        return array_values($files);
    }

    /**
     * Generate a presigned S3 download URL for backup restoration
     */
    private function generateS3DownloadUrl(Backup $backup): string
    {
        /** @var \Pterodactyl\Extensions\Filesystem\S3Filesystem $adapter */
        $adapter = $this->backupManager->adapter(Backup::ADAPTER_AWS_S3);

        $request = $adapter->getClient()->createPresignedRequest(
            $adapter->getClient()->getCommand('GetObject', [
                'Bucket' => $adapter->getBucket(),
                'Key' => sprintf('%s/%s.tar.gz', $backup->server->uuid, $backup->uuid),
                'ContentType' => 'application/x-gzip',
            ]),
            CarbonImmutable::now()->addMinutes(15) // Longer timeout for restoration downloads
        );

        return $request->getUri()->__toString();
    }

    /**
     * Prune old automatic backups for a server if the count exceeds the configured limit.
     * Only unlocked automatic backups count toward the limit. Locked backups are preserved indefinitely.
     * This ensures users don't accumulate hundreds of automatic backups without manual intervention.
     */
    private function pruneOldAutomaticBackups(Server $server): void
    {
        $limit = config('backups.automatic_backup_limit', 32); // todo: make this configurable in the panel (maybe?) - ellie

        if ($limit <= 0) {
            return;
        }

        $unlockedAutomaticBackupCount = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', false)
            ->count();

        if ($unlockedAutomaticBackupCount <= $limit) {
            return;
        }

        $excessCount = $unlockedAutomaticBackupCount - $limit;

        $oldBackups = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', false)
            ->orderBy('created_at', 'asc')
            ->limit($excessCount)
            ->get();

        if ($oldBackups->isEmpty()) {
            return;
        }

        $elytraRepository = app(\Pterodactyl\Repositories\Elytra\ElytraRepository::class);
        $deletedCount = 0;

        foreach ($oldBackups as $backup) {
            try {
                $elytraRepository->setServer($server)->createJob('backup_delete', [
                    'server_id' => $server->uuid,
                    'backup_uuid' => $backup->uuid,
                    'snapshot_id' => $backup->snapshot_id,
                    'adapter_type' => $backup->getElytraAdapterType(),
                ]);

                $deletedCount++;

                Log::info("Queued automatic backup for deletion due to limit", [
                    'server_id' => $server->id,
                    'backup_uuid' => $backup->uuid,
                    'backup_name' => $backup->name,
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to queue automatic backup deletion", [
                    'server_id' => $server->id,
                    'backup_uuid' => $backup->uuid,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $lockedCount = $server->backups()
            ->where('is_automatic', true)
            ->where('is_successful', true)
            ->where('is_locked', true)
            ->count();

        Log::info("Automatic backup pruning completed", [
            'server_id' => $server->id,
            'unlocked_automatic_backup_count' => $unlockedAutomaticBackupCount,
            'locked_automatic_backup_count' => $lockedCount,
            'limit' => $limit,
            'queued_deletions' => $deletedCount,
        ]);
    }

    /**
     * Sanitize backup error messages to prevent leaking sensitive information.
     * Never expose raw errors from backup systems as they may contain credentials or paths.
     *
     * @param string $errorMessage The raw error message from the backup system
     * @return string Generic error message safe for frontend display
     */
    private function sanitizeBackupError(string $errorMessage): string
    {
        return 'Backup operation failed. Please contact an administrator for details.'; // todo: better sanitization - elllie
    }
}

