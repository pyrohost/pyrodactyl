<?php

namespace Pterodactyl\Jobs\Server;

use Exception;
use Carbon\Carbon;
use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
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
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Service\Backup\BackupFailedException;
use Pterodactyl\Services\ServerOperations\ServerOperationService;
use Pterodactyl\Services\Subdomain\SubdomainManagementService;

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
        ElytraJobService $elytraJobService,
        ReinstallServerService $reinstallServerService,
        StartupModificationService $startupModificationService,
        DaemonFileRepository $fileRepository,
        ServerOperationService $operationService,
        SubdomainManagementService $subdomainService
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

            $backupJobId = null;
            if ($this->shouldBackup) {
                $backupJobId = $this->createBackup($elytraJobService, $operation);
            }

            if ($this->shouldWipe) {
                // If we created a backup, wait for it to complete before wiping
                if ($backupJobId) {
                    $this->waitForJobCompletion($elytraJobService, $backupJobId, $operation);
                }
                $this->wipeServerFiles($fileRepository, $operation);
            }

            $this->applyServerChanges($egg, $startupModificationService, $reinstallServerService, $operation, $subdomainService);

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
    private function createBackup(ElytraJobService $elytraJobService, ServerOperation $operation): string
    {
        $operation->updateProgress('Creating backup before proceeding...');

        $currentEgg = $this->server->egg;
        $targetEgg = Egg::find($this->eggId);

        $backupName = sprintf(
            'Software Change: %s → %s (%s)',
            $currentEgg->name ?? 'Unknown',
            $targetEgg->name ?? 'Unknown',
            now()->format('M j, g:i A')
        );

        if (strlen($backupName) > 190) {
            $backupName = substr($backupName, 0, 187) . '...';
        }

        try {
            $result = $elytraJobService->submitJob(
                $this->server,
                'backup_create',
                [
                    'operation' => 'create',
                    'adapter' => config('backups.default', 'elytra'),
                    'ignored' => '',
                    'name' => $backupName,
                ],
                $this->user
            );

            Activity::actor($this->user)->event('server:backup.software-change')
                ->property([
                    'backup_name' => $backupName,
                    'backup_job_id' => $result['job_id'],
                    'operation_id' => $this->operationId,
                    'from_egg' => $this->server->egg_id,
                    'to_egg' => $this->eggId,
                ])
                ->log();

            $operation->updateProgress('Backup job submitted successfully');

            return $result['job_id'];
        } catch (\Exception $e) {
            throw new BackupFailedException('Failed to create backup before egg change: ' . $e->getMessage());
        }
    }

    /**
     * Wait for an Elytra job to complete.
     */
    private function waitForJobCompletion(ElytraJobService $elytraJobService, string $jobId, ServerOperation $operation, int $timeoutMinutes = 30): void
    {
        $operation->updateProgress('Waiting for backup to complete before continuing...');

        $startTime = Carbon::now();
        $timeout = $startTime->addMinutes($timeoutMinutes);
        $lastProgressUpdate = 0;

        while (Carbon::now()->lt($timeout)) {
            $jobStatus = $elytraJobService->getJobStatus($this->server, $jobId);

            if (!$jobStatus) {
                throw new BackupFailedException('Backup job not found');
            }

            if ($jobStatus['status'] === 'completed') {
                $operation->updateProgress('Backup completed successfully');
                return;
            }

            if (in_array($jobStatus['status'], ['failed', 'cancelled'])) {
                throw new BackupFailedException('Backup failed: ' . ($jobStatus['error'] ?? 'Unknown error'));
            }

            $elapsed = Carbon::now()->diffInSeconds($startTime);
            if ($elapsed - $lastProgressUpdate >= 30) {
                $progress = $jobStatus['progress'] ?? 0;
                $operation->updateProgress("Backup in progress... {$progress}%");
                $lastProgressUpdate = $elapsed;
            }

            sleep(5);
        }

        throw new BackupFailedException('Backup creation timed out after ' . $timeoutMinutes . ' minutes.');
    }

    /**
     * Wipe server files if requested.
     */
    private function wipeServerFiles(DaemonFileRepository $fileRepository, ServerOperation $operation): void
    {
        $operation->updateProgress('Wiping server files...');

        try {
            $contents = $fileRepository->setServer($this->server)->getDirectory('/');

            if (!empty($contents)) {
                $filesToDelete = array_map(function ($item) {
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
                        'backup_created' => $this->shouldBackup,
                    ])
                    ->log();

                $operation->updateProgress('Server files wiped successfully');
            } else {
                $operation->updateProgress('No files found to wipe');
            }
        } catch (Exception $e) {
            Log::error('Failed to wipe files', [
                'server_id' => $this->server->id,
                'error' => $e->getMessage(),
            ]);

            // If file wipe failed and we don't have a backup, this is dangerous
            if (!$this->shouldBackup) {
                throw new \RuntimeException('File wipe failed and no backup was created. Aborting operation to prevent data loss.');
            }

            // If we have a backup, log the wipe failure but continue
            Log::warning('File wipe failed but backup was created, continuing with operation', [
                'server_id' => $this->server->id,
                'operation_id' => $this->operationId,
            ]);
        }
    }

    /**
     * Apply server configuration changes.
     */
    private function applyServerChanges(
        Egg $egg,
        StartupModificationService $startupModificationService,
        ReinstallServerService $reinstallServerService,
        ServerOperation $operation,
        SubdomainManagementService $subdomainService
    ): void {
        $operation->updateProgress('Applying software configuration...');

        DB::transaction(function () use ($egg, $startupModificationService, $reinstallServerService, $operation, $subdomainService) {
            // Check if we need to remove subdomain before changing egg
            $activeSubdomain = $this->server->activeSubdomain;
            if ($activeSubdomain) {
                // Create a temporary server with the new egg to check compatibility
                $tempServer = clone $this->server;
                $tempServer->egg = $egg;
                $tempServer->egg_id = $egg->id;

                // If new egg doesn't support subdomains, delete the existing subdomain
                if (!$tempServer->supportsSubdomains()) {
                    $operation->updateProgress('Removing incompatible subdomain...');

                    try {
                        $subdomainService->deleteSubdomain($activeSubdomain);

                        Activity::actor($this->user)->event('server:subdomain.deleted-egg-change')
                            ->property([
                                'operation_id' => $this->operationId,
                                'subdomain' => $activeSubdomain->full_domain,
                                'reason' => 'new_egg_incompatible',
                                'from_egg' => $this->server->egg_id,
                                'to_egg' => $this->eggId,
                            ])
                            ->log();
                    } catch (Exception $e) {
                        Log::warning('Failed to delete subdomain during egg change', [
                            'server_id' => $this->server->id,
                            'subdomain' => $activeSubdomain->full_domain,
                            'error' => $e->getMessage(),
                        ]);

                        // Continue with egg change even if subdomain deletion fails
                        $operation->updateProgress('Warning: Could not fully remove subdomain, continuing with egg change...');
                    }
                }
            }

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
     * Handle job failure when the Laravel queue system detects a failure.
     */
    public function failed(\Throwable $exception): void
    {
        try {
            $operation = ServerOperation::where('operation_id', $this->operationId)->first();
            $this->handleJobFailure($exception, $operation);
        } catch (\Exception $e) {
            Log::error('Failed to handle job failure cleanup', [
                'operation_id' => $this->operationId,
                'error' => $e->getMessage(),
            ]);
            $this->handleJobFailure($exception, null);
        }
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
