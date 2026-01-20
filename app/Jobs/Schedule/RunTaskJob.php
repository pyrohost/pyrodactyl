<?php

namespace Pterodactyl\Jobs\Schedule;

use Exception;
use Pterodactyl\Exceptions\Service\Backup\BackupFailedException;
use Pterodactyl\Jobs\Job;
use Carbon\CarbonImmutable;
use Pterodactyl\Models\Task;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class RunTaskJob extends Job implements ShouldQueue
{
    use DispatchesJobs;
    use InteractsWithQueue;
    use SerializesModels;

    public function __construct(public Task $task, public bool $manualRun = false)
    {
        $this->queue = 'standard';
    }

    /**
     * Run the job and send actions to the daemon running the server.
     *
     * @throws \Throwable
     */
    public function handle(
        DaemonCommandRepository $commandRepository,
        ElytraJobService $elytraJobService,
        DaemonPowerRepository $powerRepository,
    ) {
        // Do not process a task that is not set to active, unless it's been manually triggered.
        if (!$this->task->schedule->is_active && !$this->manualRun) {
            $this->markTaskNotQueued();
            $this->markScheduleComplete();

            return;
        }

        $server = $this->task->server;
        // If we made it to this point and the server status is not null it means the
        // server was likely suspended or marked as reinstalling after the schedule
        // was queued up. Just end the task right now — this should be a very rare
        // condition.
        if (!is_null($server->status)) {
            $this->failed();

            return;
        }

        // Perform the provided task against the daemon.
        try {
            switch ($this->task->action) {
                case Task::ACTION_POWER:
                    $powerRepository->setServer($server)->send($this->task->payload);
                    break;
                case Task::ACTION_COMMAND:
                    $commandRepository->setServer($server)->send($this->task->payload);
                    break;
                case Task::ACTION_BACKUP:
                    // A pre-check stage has been added because transactions are sent directly to Elytra without verification.
                    // This can be considered a temporary solution for now. In future processes, offering Elytra with better integration will play a role in removing this pre-check stage, and such transactions will be better controlled before they go to the server.
                    if ($server->hasBackupCountLimit() && $server->backup_limit < ($server->backups_count + 1)) {
                        Log::warning('Scheduled backup blocked due to backup limit', [
                            'task_id' => $this->task->id,
                            'schedule_id' => $this->task->schedule_id,
                            'server_id' => $server->id
                        ]);

                        // TooManyBackupsException is currently scoped to daemon-level backup services,
                        // therefore BackupFailedException is used here to properly fail the scheduled task.
                        throw new BackupFailedException(
                            'The permitted backup limit has been exceeded.'
                        );
                    }

                    $affectedRows = Task::where('id', $this->task->id)
                        ->where('is_processing', false)
                        ->update(['is_processing' => true]);

                    if ($affectedRows === 0) {
                        Log::warning('Backup task already processing, skipping', [
                            'task_id' => $this->task->id,
                            'schedule_id' => $this->task->schedule_id,
                            'server_id' => $server->id,
                        ]);
                        return;
                    }

                    try {
                        $ignoredFiles = !empty($this->task->payload) ? explode(PHP_EOL, $this->task->payload) : [];

                        $elytraJobService->submitJob(
                            $server,
                            'backup_create',
                            [
                                'operation' => 'create',
                                'adapter' => config('backups.default', 'elytra'),
                                'ignored' => implode("\n", $ignoredFiles),
                                'name' => 'Scheduled Backup - ' . now()->format('Y-m-d H:i'),
                                'is_automatic' => true,
                            ],
                            auth()->user() ?? $server->user
                        );
                    } finally {
                        $this->task->update(['is_processing' => false]);
                        $this->task->schedule->touch();
                    }
                    break;
                default:
                    throw new \InvalidArgumentException('Invalid task action provided: ' . $this->task->action);
            }
        } catch (\Exception $exception) {
            // If this isn't a DaemonConnectionException on a task that allows for failures
            // throw the exception back up the chain so that the task is stopped.
            if (!($this->task->continue_on_failure && $exception instanceof DaemonConnectionException)) {
                throw $exception;
            }
        }

        $this->markTaskNotQueued();
        $this->task->schedule->touch();
        $this->queueNextTask();
    }

    /**
     * Handle a failure while sending the action to the daemon or otherwise processing the job.
     */
    public function failed(?\Exception $exception = null)
    {
        if ($this->task->action === Task::ACTION_BACKUP) {
            $this->task->update(['is_processing' => false]);
        }

        $this->markTaskNotQueued();
        $this->task->schedule->touch();
        $this->markScheduleComplete();
    }

    /**
     * Get the next task in the schedule and queue it for running after the defined period of wait time.
     */
    private function queueNextTask()
    {
        /** @var Task|null $nextTask */
        $nextTask = Task::query()->where('schedule_id', $this->task->schedule_id)
            ->orderBy('sequence_id', 'asc')
            ->where('sequence_id', '>', $this->task->sequence_id)
            ->first();

        if (is_null($nextTask)) {
            $this->markScheduleComplete();

            return;
        }

        $nextTask->update(['is_queued' => true]);

        $this->dispatch((new self($nextTask, $this->manualRun))->delay($nextTask->time_offset));
    }

    /**
     * Marks the parent schedule as being complete.
     */
    private function markScheduleComplete()
    {
        $this->task->schedule()->update([
            'is_processing' => false,
            'last_run_at' => CarbonImmutable::now()->toDateTimeString(),
        ]);
    }

    /**
     * Mark a specific task as no longer being queued.
     */
    private function markTaskNotQueued()
    {
        $this->task->update(['is_queued' => false]);
    }
}
