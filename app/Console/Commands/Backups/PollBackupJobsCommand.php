<?php

namespace Pterodactyl\Console\Commands\Backups;

use Illuminate\Console\Command;
use Pterodactyl\Services\Backups\BackupJobPollingService;
use Illuminate\Support\Facades\Log;

class PollBackupJobsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'p:backups:poll
                            {--timeout=300 : Maximum execution time in seconds}
                            {--limit=50 : Maximum number of jobs to poll per execution}';

    /**
     * The console command description.
     */
    protected $description = 'Poll backup job statuses from Elytra and update panel records';

    /**
     * Create a new command instance.
     */
    public function __construct(
        private BackupJobPollingService $pollingService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $timeout = (int) $this->option('timeout');
        $limit = (int) $this->option('limit');
        $startTime = time();

        $this->info('Starting backup job polling...');

        try {
            $totalResults = ['updated' => 0, 'errors' => 0, 'completed' => 0];
            $iterations = 0;

            do {
                $iterations++;
                $results = $this->pollingService->pollAllJobs();

                // Accumulate results
                $totalResults['updated'] += $results['updated'];
                $totalResults['errors'] += $results['errors'];
                $totalResults['completed'] += $results['completed'];

                if ($results['updated'] > 0 || $results['errors'] > 0) {
                    $this->line(sprintf(
                        'Iteration %d: Updated %d jobs, %d errors, %d completed',
                        $iterations,
                        $results['updated'],
                        $results['errors'],
                        $results['completed']
                    ));
                }

                // Check if we should continue
                $elapsed = time() - $startTime;
                $shouldContinue = $elapsed < $timeout &&
                                 $totalResults['updated'] < $limit &&
                                 ($results['updated'] > 0 || $iterations === 1); // Always do at least one full iteration

                if ($shouldContinue && $results['updated'] > 0) {
                    // Brief pause before next iteration to avoid overwhelming Elytra
                    sleep(2);
                }

            } while ($shouldContinue);

            $this->info(sprintf(
                'Backup job polling completed. Total: %d updated, %d errors, %d completed in %d iterations (%.2fs)',
                $totalResults['updated'],
                $totalResults['errors'],
                $totalResults['completed'],
                $iterations,
                time() - $startTime
            ));

            Log::info('Backup job polling completed', [
                'updated' => $totalResults['updated'],
                'errors' => $totalResults['errors'],
                'completed' => $totalResults['completed'],
                'iterations' => $iterations,
                'duration' => time() - $startTime,
            ]);

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('Backup job polling failed: ' . $e->getMessage());

            Log::error('Backup job polling failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'duration' => time() - $startTime,
            ]);

            return self::FAILURE;
        }
    }
}