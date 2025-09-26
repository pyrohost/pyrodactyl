<?php

namespace Pterodactyl\Services\Backups;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\BackupJobQueue;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Repositories\Wings\DaemonBackupRepository;
use Illuminate\Support\Collection;
use GuzzleHttp\Exception\RequestException;

class BackupJobPollingService
{
    public function __construct(
        private DaemonBackupRepository $daemonRepository,
    ) {
    }

    /**
     * Poll job statuses for all pending/running backup jobs
     * This should be called regularly by a scheduled task
     */
    public function pollAllJobs(): array
    {
        $results = ['updated' => 0, 'errors' => 0, 'completed' => 0];

        // Get all jobs that need polling
        $jobsToCheck = BackupJobQueue::needsPolling()
            ->with(['backup.server'])
            ->get();

        if ($jobsToCheck->isEmpty()) {
            return $results;
        }

        Log::info('Polling backup job statuses', ['job_count' => $jobsToCheck->count()]);

        // Group jobs by server for efficient API calls
        $jobsByServer = $jobsToCheck->groupBy('backup.server.uuid');

        foreach ($jobsByServer as $serverUuid => $serverJobs) {
            try {
                $this->pollJobsForServer($serverJobs, $results);
            } catch (\Exception $e) {
                Log::error('Failed to poll jobs for server', [
                    'server_uuid' => $serverUuid,
                    'error' => $e->getMessage(),
                    'job_count' => $serverJobs->count(),
                ]);
                $results['errors'] += $serverJobs->count();
            }
        }

        // Clean up expired jobs
        $this->cleanupExpiredJobs();

        return $results;
    }

    /**
     * Poll jobs for a specific server
     */
    private function pollJobsForServer(Collection $serverJobs, array &$results): void
    {
        if ($serverJobs->isEmpty()) {
            return;
        }

        $server = $serverJobs->first()->backup->server;
        $this->daemonRepository->setServer($server);

        foreach ($serverJobs as $jobQueue) {
            try {
                $this->pollSingleJob($jobQueue, $results);
            } catch (\Exception $e) {
                Log::error('Failed to poll single job', [
                    'job_id' => $jobQueue->job_id,
                    'backup_uuid' => $jobQueue->backup->uuid,
                    'error' => $e->getMessage(),
                ]);
                $results['errors']++;

                // Mark as failed if too many polling failures
                if ($jobQueue->retry_count >= 5) {
                    $jobQueue->backup->updateJobStatus(
                        Backup::JOB_STATUS_FAILED,
                        null,
                        null,
                        'Job polling failed repeatedly: ' . $e->getMessage()
                    );
                    $jobQueue->markFailed('Job polling failed repeatedly');
                }
            }
        }
    }

    /**
     * Poll a single job and update its status
     */
    private function pollSingleJob(BackupJobQueue $jobQueue, array &$results): void
    {
        try {
            $response = $this->daemonRepository->getJobStatus($jobQueue->job_id);
            $data = json_decode($response->getBody()->getContents(), true);

            if (!$this->isValidJobResponse($data)) {
                throw new \Exception('Invalid job status response from Elytra');
            }

            $this->updateBackupFromJobStatus($jobQueue->backup, $data);
            $this->updateJobQueueFromStatus($jobQueue, $data);

            $jobQueue->updateLastPolled();
            $results['updated']++;

            // Check if job completed
            if (in_array($data['status'], ['completed', 'failed', 'cancelled'])) {
                $results['completed']++;
                Log::info('Backup job completed', [
                    'job_id' => $jobQueue->job_id,
                    'backup_uuid' => $jobQueue->backup->uuid,
                    'status' => $data['status'],
                    'progress' => $data['progress'] ?? 0,
                ]);
            }

        } catch (RequestException $e) {
            if ($e->getResponse() && $e->getResponse()->getStatusCode() === 404) {
                // Job not found on Elytra - it may have been cleaned up
                $this->handleJobNotFound($jobQueue);
                $results['completed']++;
            } else {
                throw $e;
            }
        }
    }

    /**
     * Validate job response from Elytra
     */
    private function isValidJobResponse(array $data): bool
    {
        return isset($data['job_id']) &&
               isset($data['status']) &&
               in_array($data['status'], ['pending', 'running', 'completed', 'failed', 'cancelled']);
    }

    /**
     * Update backup model based on job status from Elytra
     */
    private function updateBackupFromJobStatus(Backup $backup, array $jobData): void
    {
        $status = $jobData['status'];
        $progress = $jobData['progress'] ?? $backup->job_progress;
        $message = $jobData['message'] ?? null;
        $error = $jobData['error'] ?? null;

        // Map Elytra status to backup status
        $backupStatus = match($status) {
            'pending' => Backup::JOB_STATUS_PENDING,
            'running' => Backup::JOB_STATUS_RUNNING,
            'completed' => Backup::JOB_STATUS_COMPLETED,
            'failed' => Backup::JOB_STATUS_FAILED,
            'cancelled' => Backup::JOB_STATUS_CANCELLED,
            default => $backup->job_status,
        };

        // Update backup status
        $backup->updateJobStatus($backupStatus, $progress, $message, $error);

        // For completed backups, update additional fields from job data
        if ($status === 'completed' && isset($jobData['result'])) {
            $result = $jobData['result'];
            $updateData = [];

            if (isset($result['checksum'])) {
                $updateData['checksum'] = $result['checksum'];
            }

            if (isset($result['size'])) {
                $updateData['bytes'] = (int) $result['size'];
            }

            if (isset($result['snapshot_id'])) {
                $updateData['snapshot_id'] = $result['snapshot_id'];
            }

            if (!empty($updateData)) {
                $backup->update($updateData);
            }
        }
    }

    /**
     * Update job queue status based on Elytra response
     */
    private function updateJobQueueFromStatus(BackupJobQueue $jobQueue, array $jobData): void
    {
        $status = $jobData['status'];

        $queueStatus = match($status) {
            'pending' => BackupJobQueue::STATUS_QUEUED,
            'running' => BackupJobQueue::STATUS_PROCESSING,
            'completed' => BackupJobQueue::STATUS_COMPLETED,
            'failed' => BackupJobQueue::STATUS_FAILED,
            'cancelled' => BackupJobQueue::STATUS_CANCELLED,
            default => $jobQueue->status,
        };

        if ($queueStatus !== $jobQueue->status) {
            $errorMessage = isset($jobData['error']) ? $jobData['error'] : null;

            if ($queueStatus === BackupJobQueue::STATUS_COMPLETED) {
                $jobQueue->markCompleted();
            } elseif ($queueStatus === BackupJobQueue::STATUS_FAILED) {
                $jobQueue->markFailed($errorMessage ?? 'Job failed on Elytra');
            } else {
                $jobQueue->update(['status' => $queueStatus]);
            }
        }
    }

    /**
     * Handle case where job is not found on Elytra
     */
    private function handleJobNotFound(BackupJobQueue $jobQueue): void
    {
        // If backup is still pending/running, mark it as failed
        if ($jobQueue->backup->isInProgress()) {
            $jobQueue->backup->updateJobStatus(
                Backup::JOB_STATUS_FAILED,
                null,
                null,
                'Job not found on Elytra - may have been cleaned up'
            );
        }

        $jobQueue->markFailed('Job not found on Elytra');

        Log::warning('Backup job not found on Elytra', [
            'job_id' => $jobQueue->job_id,
            'backup_uuid' => $jobQueue->backup->uuid,
        ]);
    }

    /**
     * Clean up expired jobs that are no longer relevant
     */
    private function cleanupExpiredJobs(): int
    {
        $expiredJobs = BackupJobQueue::expired()->get();

        if ($expiredJobs->isEmpty()) {
            return 0;
        }

        Log::info('Cleaning up expired backup jobs', ['count' => $expiredJobs->count()]);

        foreach ($expiredJobs as $jobQueue) {
            // Mark associated backups as failed if still in progress
            if ($jobQueue->backup->isInProgress()) {
                $jobQueue->backup->updateJobStatus(
                    Backup::JOB_STATUS_FAILED,
                    null,
                    null,
                    'Job expired - no response from Elytra'
                );
            }

            $jobQueue->markFailed('Job expired');
        }

        return $expiredJobs->count();
    }

    /**
     * Poll status for a specific backup
     */
    public function pollBackupStatus(Backup $backup): bool
    {
        if (!$backup->job_id) {
            return false;
        }

        $jobQueue = BackupJobQueue::where('job_id', $backup->job_id)
            ->where('backup_id', $backup->id)
            ->first();

        if (!$jobQueue) {
            return false;
        }

        try {
            $this->daemonRepository->setServer($backup->server);
            $results = ['updated' => 0, 'errors' => 0, 'completed' => 0];
            $this->pollSingleJob($jobQueue, $results);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to poll backup status', [
                'backup_uuid' => $backup->uuid,
                'job_id' => $backup->job_id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}