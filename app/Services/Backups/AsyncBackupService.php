<?php

namespace Pterodactyl\Services\Backups;

use Ramsey\Uuid\Uuid;
use Carbon\CarbonImmutable;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\BackupJobQueue;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Pterodactyl\Services\Backups\BackupStorageService;
use Pterodactyl\Repositories\Wings\DaemonBackupRepository;
use Pterodactyl\Exceptions\Service\Backup\TooManyBackupsException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Exception\RequestException;

class AsyncBackupService
{
    private ?array $ignoredFiles = null;
    private bool $isLocked = false;

    public function __construct(
        private BackupRepository $repository,
        private ConnectionInterface $connection,
        private DaemonBackupRepository $daemonBackupRepository,
        private DeleteBackupService $deleteBackupService,
        private BackupManager $backupManager,
        private ServerStateService $serverStateService,
        private BackupStorageService $backupStorageService,
    ) {
    }

    /**
     * Set if the backup should be locked once it is created
     */
    public function setIsLocked(bool $isLocked): self
    {
        $this->isLocked = $isLocked;
        return $this;
    }

    /**
     * Set the files to be ignored by this backup
     */
    public function setIgnoredFiles(?array $ignored): self
    {
        if (is_array($ignored)) {
            $this->ignoredFiles = array_filter($ignored, fn($value) => strlen($value) > 0);
        } else {
            $this->ignoredFiles = [];
        }
        return $this;
    }

    /**
     * Initiate an async backup operation
     *
     * @throws \Throwable
     * @throws TooManyBackupsException
     * @throws TooManyRequestsHttpException
     */
    public function initiate(Server $server, ?string $name = null, bool $override = false): Backup
    {
        // Validate server state before creating backup
        $this->validateServerForBackup($server);

        // Check for existing backups in progress (only allow one at a time)
        $inProgressBackups = $this->repository->getBackupsInProgress($server->id);
        if ($inProgressBackups->count() > 0) {
            throw new TooManyRequestsHttpException(30, 'A backup is already in progress. Please wait for it to complete before starting another.');
        }

        $successful = $this->repository->getNonFailedBackups($server);

        if (!$server->allowsBackups()) {
            throw new TooManyBackupsException(0, 'Backups are disabled for this server');
        }

        // Block backup creation if already over storage limit
        if ($server->hasBackupStorageLimit() && $this->backupStorageService->isOverStorageLimit($server)) {
            $usage = $this->backupStorageService->getStorageUsageInfo($server);
            throw new TooManyBackupsException(0, sprintf(
                'Cannot create backup: server is already over storage limit (%.2fMB used of %.2fMB limit). Please delete old backups first.',
                $usage['used_mb'],
                $usage['limit_mb']
            ));
        }
        elseif ($server->hasBackupCountLimit() && $successful->count() >= $server->backup_limit) {
            if (!$override) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            $oldest = $successful->where('is_locked', false)->orderBy('created_at')->first();
            if (!$oldest) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            $this->deleteBackupService->handle($oldest);
        }

        return $this->connection->transaction(function () use ($server, $name) {
            $backupName = trim($name) ?: sprintf('Backup at %s', CarbonImmutable::now()->toDateTimeString());
            $backupName = preg_replace('/[^a-zA-Z0-9\s\-_\.]/', '', $backupName);
            $backupName = substr($backupName, 0, 191); // Limit to database field length

            $serverState = $this->serverStateService->captureServerState($server);

            // Use the configured default adapter
            $adapter = $this->backupManager->getDefaultAdapter();

            /** @var Backup $backup */
            $backup = $this->repository->create([
                'server_id' => $server->id,
                'uuid' => Uuid::uuid4()->toString(),
                'name' => $backupName,
                'ignored_files' => array_values($this->ignoredFiles ?? []),
                'disk' => $adapter,
                'is_locked' => $this->isLocked,
                'server_state' => $serverState,
                'job_status' => Backup::JOB_STATUS_PENDING,
                'job_progress' => 0,
                'job_message' => 'Backup job queued',
            ], true, true);

            try {
                // Send async backup request to Elytra
                $jobId = $this->requestAsyncBackup($server, $backup);

                // Update backup with job ID
                $backup->update([
                    'job_id' => $jobId,
                    'job_message' => 'Backup job submitted to Elytra',
                ]);

                // Create job queue entry for tracking
                BackupJobQueue::create([
                    'job_id' => $jobId,
                    'backup_id' => $backup->id,
                    'operation_type' => BackupJobQueue::OPERATION_CREATE,
                    'status' => BackupJobQueue::STATUS_QUEUED,
                    'job_data' => [
                        'adapter' => $backup->getElytraAdapterType(),
                        'uuid' => $backup->uuid,
                        'ignore' => implode("\n", $backup->ignored_files),
                    ],
                    'expires_at' => CarbonImmutable::now()->addHours(6), // Backup jobs expire after 6 hours
                ]);

                Log::info('Async backup initiated', [
                    'backup_uuid' => $backup->uuid,
                    'server_uuid' => $server->uuid,
                    'job_id' => $jobId,
                    'adapter' => $backup->disk,
                ]);

            } catch (\Exception $e) {
                // If daemon backup request fails, clean up the backup record
                $backup->delete();

                Log::error('Failed to initiate async backup', [
                    'backup_uuid' => $backup->uuid,
                    'server_uuid' => $server->uuid,
                    'error' => $e->getMessage(),
                ]);

                throw $e;
            }

            return $backup;
        });
    }

    /**
     * Send async backup request to Elytra and return job ID
     */
    private function requestAsyncBackup(Server $server, Backup $backup): string
    {
        try {
            $response = $this->daemonBackupRepository->setServer($server)
                ->setBackupAdapter($backup->getElytraAdapterType())
                ->backup($backup);

            $data = json_decode($response->getBody()->getContents(), true);

            if (!isset($data['job_id'])) {
                throw new \Exception('Elytra response missing job_id field');
            }

            return $data['job_id'];

        } catch (RequestException $e) {
            $response = $e->getResponse();
            $statusCode = $response ? $response->getStatusCode() : 0;
            $responseBody = $response ? $response->getBody()->getContents() : '';

            Log::error('Elytra backup request failed', [
                'server_uuid' => $server->uuid,
                'backup_uuid' => $backup->uuid,
                'status_code' => $statusCode,
                'response' => $responseBody,
                'error' => $e->getMessage(),
            ]);

            throw new \Exception("Failed to initiate backup on Elytra: HTTP {$statusCode} - " . $e->getMessage());
        }
    }

    /**
     * Cancel an async backup operation
     */
    public function cancel(Backup $backup): bool
    {
        if (!$backup->canCancel()) {
            return false;
        }

        try {
            // Send cancel request to Elytra
            $this->daemonBackupRepository->setServer($backup->server);
            $response = $this->daemonBackupRepository->cancelJob($backup->job_id);

            // Update backup status
            $backup->updateJobStatus(
                Backup::JOB_STATUS_CANCELLED,
                $backup->job_progress,
                'Backup cancelled by user'
            );

            // Update job queue entry
            $jobQueueEntry = BackupJobQueue::where('job_id', $backup->job_id)->first();
            if ($jobQueueEntry) {
                $jobQueueEntry->update(['status' => BackupJobQueue::STATUS_CANCELLED]);
            }

            Log::info('Backup cancelled', [
                'backup_uuid' => $backup->uuid,
                'job_id' => $backup->job_id,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to cancel backup', [
                'backup_uuid' => $backup->uuid,
                'job_id' => $backup->job_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Retry a failed backup
     */
    public function retry(Backup $backup): bool
    {
        if (!$backup->canRetry()) {
            return false;
        }

        try {
            // Reset backup status
            $backup->updateJobStatus(
                Backup::JOB_STATUS_PENDING,
                0,
                'Backup retry requested'
            );

            // Find and update job queue entry
            $jobQueueEntry = BackupJobQueue::where('job_id', $backup->job_id)->first();
            if ($jobQueueEntry && $jobQueueEntry->canRetry()) {
                $jobQueueEntry->markForRetry('Backup retry requested by user');
            }

            // Send new backup request to Elytra
            $jobId = $this->requestAsyncBackup($backup->server, $backup);

            // Update backup with new job ID
            $backup->update([
                'job_id' => $jobId,
                'job_message' => 'Backup retry submitted to Elytra',
            ]);

            // Create new job queue entry
            BackupJobQueue::create([
                'job_id' => $jobId,
                'backup_id' => $backup->id,
                'operation_type' => BackupJobQueue::OPERATION_CREATE,
                'status' => BackupJobQueue::STATUS_QUEUED,
                'job_data' => [
                    'adapter' => $backup->getElytraAdapterType(),
                    'uuid' => $backup->uuid,
                    'ignore' => implode("\n", $backup->ignored_files),
                ],
                'retry_count' => $jobQueueEntry ? $jobQueueEntry->retry_count + 1 : 1,
                'expires_at' => CarbonImmutable::now()->addHours(6),
            ]);

            Log::info('Backup retry initiated', [
                'backup_uuid' => $backup->uuid,
                'old_job_id' => $jobQueueEntry?->job_id,
                'new_job_id' => $jobId,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to retry backup', [
                'backup_uuid' => $backup->uuid,
                'job_id' => $backup->job_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Validate that the server is in a valid state for backup creation
     */
    private function validateServerForBackup(Server $server): void
    {
        if ($server->isSuspended()) {
            throw new TooManyBackupsException(0, 'Cannot create backup for suspended server.');
        }

        if (!$server->isInstalled()) {
            throw new TooManyBackupsException(0, 'Cannot create backup for server that is not fully installed.');
        }

        if ($server->status === Server::STATUS_RESTORING_BACKUP) {
            throw new TooManyBackupsException(0, 'Cannot create backup while server is restoring from another backup.');
        }

        if ($server->transfer) {
            throw new TooManyBackupsException(0, 'Cannot create backup while server is being transferred.');
        }
    }
}