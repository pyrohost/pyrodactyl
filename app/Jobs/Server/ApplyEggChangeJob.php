<?php

namespace Pterodactyl\Jobs\Server;

use Exception;
use Carbon\Carbon;
use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\ServerOperation;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Backups\InitiateBackupService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Service\Backup\BackupFailedException;
use Pterodactyl\Services\ServerOperations\ServerOperationService;

/**
 * Queue job to apply server egg configuration changes.
 *
 * Handles the complete egg change process including backup creation,
 * file wiping, server configuration updates, and reinstallation.
 */
class ApplyEggChangeJob extends Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public $timeout;
    public $tries = 1;
    public $failOnTimeout = true;

    public function __construct(
        public Server $server,
        public User $user,
        public int $eggId,
        public int $nestId,
        public ?string $dockerImage,
        public ?string $startupCommand,
        public array $environment,
        public bool $shouldBackup,
        public bool $shouldWipe,
        public string $operationId
    ) {
        $this->queue = 'standard';
        $this->timeout = config('server_operations.timeouts.egg_change', 1800);
    }

    /**
     * Execute the egg change job.
     */
    public function handle(
        InitiateBackupService $backupService,
        ReinstallServerService $reinstallServerService,
        StartupModificationService $startupModificationService,
        DaemonFileRepository $fileRepository,
        ServerOperationService $operationService
    ): void {
        $operation = null;
        
        try {
            $operation = ServerOperation::where('operation_id', $this->operationId)->firstOrFail();
            $operation->markAsStarted();
            
            Activity::actor($this->user)->event('server:software.change-started')
                ->property([
                    'operation_id' => $this->operationId,
                    'from_egg' => $this->server->egg_id,
                    'to_egg' => $this->eggId,
                    'should_backup' => $this->shouldBackup,
                    'should_wipe' => $this->shouldWipe,
                ])
                ->log();

            $egg = Egg::query()
                ->with(['variables', 'nest'])
                ->findOrFail($this->eggId);

            $backup = null;

            if ($this->shouldBackup) {
                $backup = $this->createBackup($backupService, $operation);
            }

            if ($this->shouldWipe) {
                $this->wipeServerFiles($fileRepository, $operation, $backup);
            }

            $this->applyServerChanges($egg, $startupModificationService, $reinstallServerService, $operation);

            $this->logSuccessfulChange();

            $operation->markAsCompleted('Software configuration applied successfully. Server installation completed.');

        } catch (Exception $e) {
            $this->handleJobFailure($e, $operation);
            throw $e;
        }
    }

    /**
     * Create backup before proceeding with changes.
     */
    private function createBackup(InitiateBackupService $backupService, ServerOperation $operation): Backup
    {
        $operation->updateProgress('Creating backup before proceeding...');
        
        $backupName = "Software Change Backup - " . now()->format('Y-m-d H:i:s');
        $backup = $backupService
            ->setIsLocked(false)
            ->handle($this->server, $backupName);

        Activity::actor($this->user)->event('server:backup.software-change')
            ->property([
                'backup_name' => $backupName,
                'backup_uuid' => $backup->uuid,
                'operation_id' => $this->operationId,
                'from_egg' => $this->server->egg_id,
                'to_egg' => $this->eggId,
            ])
            ->log();

        $operation->updateProgress('Waiting for backup to complete...');
        $this->waitForBackupCompletion($backup, $operation);

        $backup->refresh();
        if (!$backup->is_successful) {
            throw new BackupFailedException('Backup failed. Aborting software change to prevent data loss.');
        }

        return $backup;
    }

    /**
     * Wipe server files if requested.
     */
    private function wipeServerFiles(DaemonFileRepository $fileRepository, ServerOperation $operation, ?Backup $backup): void
    {
        $operation->updateProgress('Wiping server files...');
        
        try {
            $contents = $fileRepository->setServer($this->server)->getDirectory('/');

            if (!empty($contents)) {
                $filesToDelete = array_map(function($item) {
                    return $item['name'];
                }, $contents);

                if (count($filesToDelete) > 1000) {
                    Log::warning('Large number of files to delete', [
                        'server_id' => $this->server->id,
                        'file_count' => count($filesToDelete),
                    ]);
                }

                $fileRepository->setServer($this->server)->deleteFiles('/', $filesToDelete);

                Activity::actor($this->user)->event('server:files.software-change-wipe')
                    ->property([
                        'operation_id' => $this->operationId,
                        'from_egg' => $this->server->egg_id,
                        'to_egg' => $this->eggId,
                        'files_deleted' => count($filesToDelete),
                        'backup_verified' => $backup ? true : false,
                    ])
                    ->log();
            }
        } catch (Exception $e) {
            Log::error('Failed to wipe files', [
                'server_id' => $this->server->id,
                'error' => $e->getMessage(),
            ]);

            if (!$backup) {
                throw new \RuntimeException('File wipe failed and no backup was created. Aborting operation to prevent data loss.');
            }
        }
    }

    /**
     * Apply server configuration changes.
     */
    private function applyServerChanges(
        Egg $egg,
        StartupModificationService $startupModificationService,
        ReinstallServerService $reinstallServerService,
        ServerOperation $operation
    ): void {
        $operation->updateProgress('Applying software configuration...');
        
        DB::transaction(function () use ($egg, $startupModificationService, $reinstallServerService, $operation) {
            if ($this->server->egg_id !== $this->eggId || $this->server->nest_id !== $this->nestId) {
                $this->server->update([
                    'egg_id' => $this->eggId,
                    'nest_id' => $this->nestId,
                ]);
            }

            $updateData = [
                'startup' => $this->startupCommand ?: $egg->startup,
                'docker_image' => $this->dockerImage,
                'environment' => $this->environment,
            ];

            $updatedServer = $startupModificationService
                ->setUserLevel(User::USER_LEVEL_ADMIN)
                ->handle($this->server, $updateData);

            $operation->updateProgress('Reinstalling server...');
            $reinstallServerService->handle($updatedServer);
            
            $operation->updateProgress('Finalizing installation...');
        });
    }

    /**
     * Log successful software change.
     */
    private function logSuccessfulChange(): void
    {
        Activity::actor($this->user)->event('server:software.changed')
            ->property([
                'operation_id' => $this->operationId,
                'original_egg_id' => $this->server->getOriginal('egg_id'),
                'new_egg_id' => $this->eggId,
                'original_nest_id' => $this->server->getOriginal('nest_id'),
                'new_nest_id' => $this->nestId,
                'original_image' => $this->server->getOriginal('image'),
                'new_image' => $this->dockerImage,
                'backup_created' => $this->shouldBackup,
                'files_wiped' => $this->shouldWipe,
            ])
            ->log();
    }

    /**
     * Handle job failure.
     */
    public function failed(\Throwable $exception): void
    {
        try {
            $operation = ServerOperation::where('operation_id', $this->operationId)->first();
            
            Log::error('Egg change job failed', [
                'server_id' => $this->server->id,
                'operation_id' => $this->operationId,
                'error' => $exception->getMessage(),
            ]);

            if ($operation) {
                $operation->markAsFailed('Job failed: ' . $exception->getMessage());
            }

            Activity::actor($this->user)->event('server:software.change-job-failed')
                ->property([
                    'operation_id' => $this->operationId,
                    'error' => $exception->getMessage(),
                    'attempted_egg_id' => $this->eggId,
                ])
                ->log();
        } catch (\Throwable $e) {
            Log::critical('Failed to handle job failure properly', [
                'operation_id' => $this->operationId,
                'original_error' => $exception->getMessage(),
                'handler_error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Wait for backup completion with timeout monitoring.
     */
    private function waitForBackupCompletion(Backup $backup, ServerOperation $operation, int $timeoutMinutes = 30): void
    {
        $startTime = Carbon::now();
        $timeout = $startTime->addMinutes($timeoutMinutes);
        $lastProgressUpdate = 0;
        
        while (Carbon::now()->lt($timeout)) {
            $backup->refresh();

            if ($backup->is_successful && !is_null($backup->completed_at)) {
                $operation->updateProgress('Backup completed successfully');
                return;
            }

            if (!is_null($backup->completed_at) && !$backup->is_successful) {
                throw new BackupFailedException('Backup failed during creation process.');
            }

            $elapsed = Carbon::now()->diffInSeconds($startTime);
            if ($elapsed - $lastProgressUpdate >= 30) {
                $minutes = floor($elapsed / 60);
                $seconds = $elapsed % 60;
                $timeStr = $minutes > 0 ? "{$minutes}m {$seconds}s" : "{$seconds}s";
                $operation->updateProgress("Backup in progress... ({$timeStr} elapsed)");
                $lastProgressUpdate = $elapsed;
            }

            sleep(5);
        }

        throw new BackupFailedException('Backup creation timed out after ' . $timeoutMinutes . ' minutes.');
    }

    /**
     * Handle job failure with error logging.
     */
    private function handleJobFailure(\Throwable $exception, ?ServerOperation $operation): void
    {
        Log::error('Egg change job failed', [
            'operation_id' => $this->operationId,
            'error' => $exception->getMessage(),
            'server_id' => $this->server->id,
            'user_id' => $this->user->id,
        ]);

        if ($operation) {
            $operation->markAsFailed('Operation failed: ' . $exception->getMessage());
        }

        Activity::actor($this->user)->event('server:software.change-failed')
            ->property([
                'operation_id' => $this->operationId,
                'error' => $exception->getMessage(),
                'attempted_egg_id' => $this->eggId,
                'attempted_nest_id' => $this->nestId,
            ])
            ->log();
    }
}