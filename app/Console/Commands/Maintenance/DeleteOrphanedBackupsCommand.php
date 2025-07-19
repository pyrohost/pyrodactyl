<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Illuminate\Console\Command;
use Pterodactyl\Models\Backup;
use Pterodactyl\Services\Backups\DeleteBackupService;
use Illuminate\Database\Eloquent\Builder;

class DeleteOrphanedBackupsCommand extends Command
{
    protected $signature = 'p:maintenance:delete-orphaned-backups {--dry-run : Show what would be deleted without actually deleting}';

    protected $description = 'Delete backups that reference non-existent servers (orphaned backups).';

    /**
     * DeleteOrphanedBackupsCommand constructor.
     */
    public function __construct(private DeleteBackupService $deleteBackupService)
    {
        parent::__construct();
    }

    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        // Find backups that reference non-existent servers
        $orphanedBackups = Backup::whereDoesntHave('server')->get();

        if ($orphanedBackups->isEmpty()) {
            $this->info('No orphaned backups found.');
            return;
        }

        $count = $orphanedBackups->count();
        
        if ($isDryRun) {
            $this->warn("Found {$count} orphaned backup(s) that would be deleted:");
            
            $this->table(
                ['ID', 'UUID', 'Name', 'Server ID', 'Disk', 'Created At'],
                $orphanedBackups->map(function (Backup $backup) {
                    return [
                        $backup->id,
                        $backup->uuid,
                        $backup->name,
                        $backup->server_id,
                        $backup->disk,
                        $backup->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray()
            );
            
            $this->info('Run without --dry-run to actually delete these backups.');
            return;
        }

        if (!$this->confirm("Are you sure you want to delete {$count} orphaned backup(s)? This action cannot be undone.")) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->warn("Deleting {$count} orphaned backup(s)...");

        $deletedCount = 0;
        $failedCount = 0;

        foreach ($orphanedBackups as $backup) {
            try {
                $this->deleteBackupService->handle($backup);
                $deletedCount++;
                $this->info("Deleted backup: {$backup->uuid} ({$backup->name})");
            } catch (\Exception $exception) {
                $failedCount++;
                $this->error("Failed to delete backup {$backup->uuid}: {$exception->getMessage()}");
                
                // If we can't delete from storage, at least remove the database record
                try {
                    $backup->delete();
                    $this->warn("Removed database record for backup {$backup->uuid} (storage deletion failed)");
                } catch (\Exception $dbException) {
                    $this->error("Failed to remove database record for backup {$backup->uuid}: {$dbException->getMessage()}");
                }
            }
        }

        $this->info("Cleanup completed. Deleted: {$deletedCount}, Failed: {$failedCount}");
    }
}