<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Illuminate\Console\Command;
use Pterodactyl\Models\Backup;
use Illuminate\Database\Eloquent\Builder;

class DeleteOrphanedBackupsCommand extends Command
{
    protected $signature = 'p:maintenance:delete-orphaned-backups {--dry-run : Show what would be deleted without actually deleting}';

    protected $description = 'Delete backups that reference non-existent servers (orphaned backups), including soft-deleted backups.';

    /**
     * DeleteOrphanedBackupsCommand constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        // Find backups that reference non-existent servers including 
        // soft-deleted backups since they might be orphaned too
        $orphanedBackups = Backup::withTrashed()
            ->whereDoesntHave('server')
            ->get();

        if ($orphanedBackups->isEmpty()) {
            $this->info('No orphaned backups found.');
            return;
        }

        $count = $orphanedBackups->count();
        $totalSize = $orphanedBackups->sum('bytes');
        
        if ($isDryRun) {
            $this->warn("Found {$count} orphaned backup(s) that would be deleted (Total size: {$this->formatBytes($totalSize)}):");
            
            $this->table(
                ['ID', 'UUID', 'Name', 'Server ID', 'Disk', 'Size', 'Status', 'Created At'],
                $orphanedBackups->map(function (Backup $backup) {
                    return [
                        $backup->id,
                        $backup->uuid,
                        $backup->name,
                        $backup->server_id,
                        $backup->disk,
                        $this->formatBytes($backup->bytes),
                        $backup->trashed() ? 'Soft Deleted' : 'Active',
                        $backup->created_at->format('Y-m-d H:i:s'),
                    ];
                })->toArray()
            );
            
            $this->info('Run without --dry-run to actually delete these backups.');
            return;
        }

        if (!$this->confirm("Are you sure you want to delete {$count} orphaned backup(s) ({$this->formatBytes($totalSize)})? This action cannot be undone.")) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->warn("Deleting {$count} orphaned backup(s) ({$this->formatBytes($totalSize)})...");

        $deletedCount = 0;
        $failedCount = 0;

        foreach ($orphanedBackups as $backup) {
            try {
                // If backup is already soft-deleted, force delete it completely
                if ($backup->trashed()) {
                    $backup->forceDelete();
                    $deletedCount++;
                    $this->info("Force deleted soft-deleted backup: {$backup->uuid} ({$backup->name}) - {$this->formatBytes($backup->bytes)}");
                } else {
                    // Delete the orphaned backup from the database
                    $backup->forceDelete();
                    $deletedCount++;
                    $this->info("Deleted backup: {$backup->uuid} ({$backup->name}) - {$this->formatBytes($backup->bytes)}");
                }
            } catch (\Exception $exception) {
                $failedCount++;
                $this->error("Failed to delete backup {$backup->uuid}: {$exception->getMessage()}");
                
                // If we can't delete from storage, at least remove the database record
                try {
                    if ($backup->trashed()) {
                        $backup->forceDelete();
                        $this->warn("Force deleted soft-deleted backup {$backup->uuid} (storage deletion failed)");
                    } else {
                        $backup->delete();
                        $this->warn("Removed database record for backup {$backup->uuid} (storage deletion failed)");
                    }
                } catch (\Exception $dbException) {
                    $this->error("Failed to remove database record for backup {$backup->uuid}: {$dbException->getMessage()}");
                }
            }
        }

        $this->info("Cleanup completed. Deleted: {$deletedCount}, Failed: {$failedCount}");
    }

    /**
     * Format bytes into human readable format.
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $base = 1024;
        $exponent = floor(log($bytes) / log($base));
        $exponent = min($exponent, count($units) - 1);

        $value = $bytes / pow($base, $exponent);
        $unit = $units[$exponent];

        return sprintf('%.2f %s', $value, $unit);
    }
}