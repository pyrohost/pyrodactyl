<?php

namespace Pterodactyl\Services\Elytra;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ElytraJob;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Contracts\Elytra\Job;
use Pterodactyl\Repositories\Elytra\ElytraRepository;

class ElytraJobService
{
    private array $jobHandlers = [];

    public function __construct(
        private ElytraRepository $elytraRepository,
    ) {
        $this->discoverHandlers();
    }

    private function discoverHandlers(): void
    {
        $handlerClasses = [
            \Pterodactyl\Services\Elytra\Jobs\BackupJob::class,
        ];

        foreach ($handlerClasses as $handlerClass) {
            if (class_exists($handlerClass)) {
                $handler = app($handlerClass);
                if ($handler instanceof Job) {
                    foreach ($handler::getSupportedJobTypes() as $jobType) {
                        $this->jobHandlers[$jobType] = $handler;
                    }
                }
            }
        }
    }

    public function registerJobHandler(Job $handler): void
    {
        foreach ($handler::getSupportedJobTypes() as $jobType) {
            $this->jobHandlers[$jobType] = $handler;
        }
    }

    public function submitJob(Server $server, string $jobType, array $jobData, User $user): array
    {
        $handler = $this->getJobHandler($jobType);
        $validatedData = $handler->validateJobData($jobData);
        $job = ElytraJob::create([
            'server_id' => $server->id,
            'user_id' => $user->id,
            'job_type' => $jobType,
            'job_data' => $validatedData,
            'status' => ElytraJob::STATUS_PENDING,
            'progress' => 0,
            'created_at' => CarbonImmutable::now(),
        ]);

        try {
            $elytraJobId = $handler->submitToElytra($server, $job, $this->elytraRepository);
            $job->update([
                'elytra_job_id' => $elytraJobId,
                'status' => ElytraJob::STATUS_SUBMITTED,
                'submitted_at' => CarbonImmutable::now(),
            ]);

            return [
                'job_id' => $job->uuid,
                'elytra_job_id' => $elytraJobId,
                'status' => 'submitted',
                'message' => 'Job submitted to Elytra successfully',
                'data' => $handler->formatJobResponse($job),
            ];

        } catch (\Exception $e) {
            $job->update([
                'status' => ElytraJob::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'completed_at' => CarbonImmutable::now(),
            ]);

            Log::error('Failed to submit job to Elytra', [
                'job_id' => $job->uuid,
                'job_type' => $jobType,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function getJobStatus(Server $server, string $jobId): ?array
    {
        $job = ElytraJob::where('uuid', $jobId)
            ->where('server_id', $server->id)
            ->first();

        if (!$job) {
            return null;
        }

        $handler = $this->getJobHandler($job->job_type);

        return [
            'job_id' => $job->uuid,
            'elytra_job_id' => $job->elytra_job_id,
            'type' => $job->job_type,
            'status' => $job->status,
            'progress' => $job->progress,
            'message' => $job->status_message,
            'error' => $job->error_message,
            'created_at' => $job->created_at,
            'submitted_at' => $job->submitted_at,
            'completed_at' => $job->completed_at,
            'data' => $handler->formatJobResponse($job),
        ];
    }

    public function cancelJob(Server $server, string $jobId): array
    {
        $job = ElytraJob::where('uuid', $jobId)
            ->where('server_id', $server->id)
            ->first();

        if (!$job) {
            throw new \Exception('Job not found');
        }

        if (!in_array($job->status, [ElytraJob::STATUS_PENDING, ElytraJob::STATUS_SUBMITTED, ElytraJob::STATUS_RUNNING])) {
            throw new \Exception('Job cannot be cancelled in current status');
        }

        $handler = $this->getJobHandler($job->job_type);

        try {
            $handler->cancelOnElytra($server, $job, $this->elytraRepository);
            $job->update([
                'status' => ElytraJob::STATUS_CANCELLED,
                'completed_at' => CarbonImmutable::now(),
            ]);

            return [
                'job_id' => $job->uuid,
                'status' => 'cancelled',
                'message' => 'Job cancelled successfully',
            ];

        } catch (\Exception $e) {
            Log::error('Failed to cancel job on Elytra', [
                'job_id' => $job->uuid,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function listJobs(Server $server, ?string $jobType = null, ?string $status = null): array
    {
        $query = ElytraJob::where('server_id', $server->id);

        if ($jobType) {
            $query->where('job_type', $jobType);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $jobs = $query->orderBy('created_at', 'desc')->get();

        return $jobs->map(function ($job) {
            $handler = $this->getJobHandler($job->job_type);

            return [
                'job_id' => $job->uuid,
                'elytra_job_id' => $job->elytra_job_id,
                'type' => $job->job_type,
                'status' => $job->status,
                'progress' => $job->progress,
                'message' => $job->status_message,
                'error' => $job->error_message,
                'created_at' => $job->created_at,
                'submitted_at' => $job->submitted_at,
                'completed_at' => $job->completed_at,
                'data' => $handler->formatJobResponse($job),
            ];
        })->toArray();
    }

    public function updateJobStatus(string $elytraJobId, array $statusData): void
    {
        $job = ElytraJob::where('elytra_job_id', $elytraJobId)->first();

        if (!$job) {
            Log::warning('Received status update for unknown job', [
                'elytra_job_id' => $elytraJobId,
            ]);
            return;
        }

        $server = $job->server;
        $currentStatus = $job->status;
        $newStatus = $statusData['status'] ?? 'unknown';
        $job->update([
            'status' => $newStatus,
            'progress' => $statusData['progress'] ?? $job->progress,
            'status_message' => $statusData['message'] ?? null,
            'error_message' => $statusData['error_message'] ?? null,
        ]);

        if ($newStatus === 'completed' || $newStatus === 'failed') {
            $handler = $this->getJobHandler($job->job_type);
            $handler->processStatusUpdate($job, $statusData);
        }

        Log::info('Job status updated', [
            'job_id' => $job->uuid,
            'elytra_job_id' => $elytraJobId,
            'job_type' => $job->job_type,
            'old_status' => $currentStatus,
            'new_status' => $newStatus,
            'progress' => $statusData['progress'] ?? 0,
        ]);
    }


    private function fireJobStatusEvent(ElytraJob $job, array $statusData): void
    {
        $server = $job->server;
        $eventName = $this->getJobEventName($job->job_type, $job->status);

        $eventData = [
            'job_id' => $job->uuid,
            'elytra_job_id' => $job->elytra_job_id,
            'job_type' => $job->job_type,
            'status' => $job->status,
            'progress' => $job->progress,
            'message' => $job->status_message,
            'error' => $job->error_message,
        ];

        if ($job->job_type === 'backup_create') {
            if (isset($statusData['checksum'])) {
                $eventData['checksum'] = $statusData['checksum'];
                $eventData['checksum_type'] = $statusData['checksum_type'] ?? 'sha1';
            }
            if (isset($statusData['size'])) {
                $eventData['file_size'] = $statusData['size'];
            }
            if (isset($statusData['snapshot_id'])) {
                $eventData['snapshot_id'] = $statusData['snapshot_id'];
            }

            if ($job->job_data && isset($job->job_data['backup_uuid'])) {
                $eventData['uuid'] = $job->job_data['backup_uuid'];
            }
        }

        $server->events()->publish($eventName, json_encode($eventData));

        Log::debug('Fired WebSocket event for job status', [
            'event' => $eventName,
            'server' => $server->uuid,
            'job_id' => $job->uuid,
            'status' => $job->status,
        ]);
    }

    private function getJobEventName(string $jobType, string $status): string
    {
        return match ([$jobType, $status]) {
            ['backup_create', 'pending'] => 'backup.started',
            ['backup_create', 'running'] => 'backup.progress',
            ['backup_create', 'completed'] => 'backup.completed',
            ['backup_create', 'failed'] => 'backup.failed',

            ['backup_delete', 'pending'] => 'backup.delete.started',
            ['backup_delete', 'running'] => 'backup.delete.progress',
            ['backup_delete', 'completed'] => 'backup.delete.completed',
            ['backup_delete', 'failed'] => 'backup.delete.failed',

            ['backup_restore', 'pending'] => 'backup.restore.started',
            ['backup_restore', 'running'] => 'backup.restore.progress',
            ['backup_restore', 'completed'] => 'backup.restore.completed',
            ['backup_restore', 'failed'] => 'backup.restore.failed',

            default => "job.{$status}",
        };
    }

    public function getJobHandler(string $jobType): Job
    {
        if (!isset($this->jobHandlers[$jobType])) {
            throw new \Exception("No handler registered for job type: {$jobType}");
        }

        return $this->jobHandlers[$jobType];
    }
}