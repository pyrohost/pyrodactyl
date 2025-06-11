<?php

namespace Pterodactyl\Services\Schedules;

use Exception;
use Pterodactyl\Models\Schedule;
use Illuminate\Contracts\Bus\Dispatcher;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class ProcessScheduleService
{
    /**
     * ProcessScheduleService constructor.
     */
    public function __construct(private ConnectionInterface $connection, private Dispatcher $dispatcher, private DaemonServerRepository $serverRepository)
    {
    }

    /**
     * Process a schedule and push the first task onto the queue worker.
     *
     * @throws \Throwable
     */
    public function handle(Schedule $schedule, bool $now = false): void
    {
        // Add a transaction with a row-level lock to prevent double-processing
        $this->connection->transaction(function () use (&$schedule, $now) {
            // Reload the schedule with a FOR UPDATE lock
            $lockedSchedule = Schedule::where('id', $schedule->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedSchedule) {
                throw new ModelNotFoundException('Schedule not found for locking.');
            }

            // Prevent double-processing if another process already set is_processing
            if ($lockedSchedule->is_processing) {
                throw new DisplayException('Schedule is already being processed.');
            }

            /** @var \Pterodactyl\Models\Task $task */
            $task = $lockedSchedule->tasks()->orderBy('sequence_id')->first();

            if (is_null($task)) {
                throw new DisplayException('Cannot process schedule for task execution: no tasks are registered.');
            }

            $lockedSchedule->forceFill([
                'is_processing' => true,
                'next_run_at' => $lockedSchedule->getNextRunDate(),
            ])->saveOrFail();

            $task->update(['is_queued' => true]);

            $schedule = $lockedSchedule;

            $GLOBALS['__process_schedule_task'] = $task;
        });

        // Retrieve the task from the global (not ideal, but avoids refactoring signature)
        $task = $GLOBALS['__process_schedule_task'];
        unset($GLOBALS['__process_schedule_task']);

        $job = new RunTaskJob($task, $now);
        if ($schedule->only_when_online) {
            try {
                $details = $this->serverRepository->setServer($schedule->server)->getDetails();
                $state = $details['state'] ?? 'offline';
                if (in_array($state, ['offline', 'stopping'])) {
                    $job->failed();
                    return;
                }
            } catch (\Exception $exception) {
                if (!$exception instanceof DaemonConnectionException) {
                    $job->failed($exception);
                }
                $job->failed();
                return;
            }
        }

        if (!$now) {
            $this->dispatcher->dispatch($job->delay($task->time_offset));
        } else {
            try {
                $this->dispatcher->dispatchNow($job);
            } catch (\Exception $exception) {
                $job->failed($exception);
                throw $exception;
            }
        }
    }
}