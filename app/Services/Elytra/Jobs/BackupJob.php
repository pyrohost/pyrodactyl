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
use Pterodactyl\Transformers\Api\Client\BackupTransformer;

class BackupJob implements Job
{
    public function __construct(
        private ServerStateService $serverStateService,
        private BackupTransformer $backupTransformer,
    ) {}

    public static function getSupportedJobTypes(): array
    {
        return ['backup_create', 'backup_delete', 'backup_restore', 'backup_download'];
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
            ],
            'delete' => [
                'operation' => 'required|string|in:delete',
                'backup_uuid' => 'required|string|uuid',
            ],
            'restore' => [
                'operation' => 'required|string|in:restore',
                'backup_uuid' => 'required|string|uuid',
                'truncate_directory' => 'boolean',
            ],
            'download' => [
                'operation' => 'required|string|in:download',
                'backup_uuid' => 'required|string|uuid',
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

        $job->update([
            'status' => $successful ? ElytraJob::STATUS_COMPLETED : ElytraJob::STATUS_FAILED,
            'progress' => $successful ? 100 : $job->progress,
            'status_message' => $statusData['message'] ?? ($successful ? 'Completed successfully' : 'Failed'),
            'error_message' => $successful ? null : ($statusData['error_message'] ?? 'Unknown error'),
            'completed_at' => CarbonImmutable::now(),
        ]);

        match ($operation) {
            'create' => $this->handleCreateCompletion($job, $statusData),
            'delete' => $this->handleDeleteCompletion($job, $statusData),
            'restore' => $this->handleRestoreCompletion($job, $statusData),
            'download' => $this->handleDownloadCompletion($job, $statusData),
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
            'adapter_type' => $backup->getElytraAdapterType(),
        ];

        $response = $elytraRepository->setServer($server)->createJob('backup_delete', $elytraJobData);

        return $response['job_id'] ?? throw new \Exception('No job ID returned from Elytra');
    }

    private function submitRestoreJob(Server $server, ElytraJob $job, ElytraRepository $elytraRepository): string
    {
        $jobData = $job->job_data;
        $backup = Backup::where('uuid', $jobData['backup_uuid'])->firstOrFail();

        $elytraJobData = [
            'server_id' => $server->uuid,
            'backup_uuid' => $backup->uuid,
            'adapter_type' => $backup->getElytraAdapterType(),
            'truncate_directory' => $jobData['truncate_directory'] ?? false,
            'download_url' => $jobData['download_url'] ?? null,
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

            $backupData = [
                'server_id' => $server->id,
                'uuid' => $backupUuid,
                'name' => $jobData['name'] ?? $this->generateBackupName(),
                'ignored_files' => $this->parseIgnoredFiles($jobData['ignored'] ?? ''),
                'disk' => $actualAdapter,
                'is_successful' => true,
                'is_locked' => false,
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

            Log::info("Backup record created successfully", [
                'backup_id' => $backup->id,
                'backup_uuid' => $backup->uuid,
                'disk' => $backup->disk,
                'size_mb' => round($backup->bytes / 1024 / 1024, 2),
            ]);
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
        if ($statusData['successful']) {
            $jobData = $job->job_data;
            $backup = Backup::where('uuid', $jobData['backup_uuid'])->first();

            if ($backup) {
                $backup->delete();
            }
        }
    }

    private function handleRestoreCompletion(ElytraJob $job, array $statusData): void
    {
    }

    private function handleDownloadCompletion(ElytraJob $job, array $statusData): void
    {
    }

    private function getOperationFromJobType(string $jobType): string
    {
        return match ($jobType) {
            'backup_create' => 'create',
            'backup_delete' => 'delete',
            'backup_restore' => 'restore',
            'backup_download' => 'download',
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
}