<?php

namespace Pterodactyl\Services\Backups;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Backup;
use Pterodactyl\Repositories\Eloquent\BackupRepository;

class BackupStorageService
{
    public function __construct(
        private BackupRepository $repository,
    ) {
    }

    public function calculateServerBackupStorage(Server $server): int
    {
        return $this->repository->getNonFailedBackups($server)->sum('bytes');
    }

    public function isOverStorageLimit(Server $server): bool
    {
        if (!$server->hasBackupStorageLimit()) {
            return false;
        }

        return $this->calculateServerBackupStorage($server) > $server->getBackupStorageLimitBytes();
    }

    public function wouldExceedStorageLimit(Server $server, int $estimatedBackupSizeBytes): bool
    {
        if (!$server->hasBackupStorageLimit()) {
            return false;
        }

        $currentUsage = $this->calculateServerBackupStorage($server);
        $estimatedSize = $estimatedBackupSizeBytes * 0.5; // Conservative estimate for deduplication

        return ($currentUsage + $estimatedSize) > $server->getBackupStorageLimitBytes();
    }

    public function getStorageUsageInfo(Server $server): array
    {
        $usedBytes = $this->calculateServerBackupStorage($server);
        $limitBytes = $server->getBackupStorageLimitBytes();
        $mbDivisor = 1024 * 1024;

        $result = [
            'used_bytes' => $usedBytes,
            'used_mb' => round($usedBytes / $mbDivisor, 2),
            'limit_bytes' => $limitBytes,
            'limit_mb' => $server->backup_storage_limit,
            'has_limit' => $server->hasBackupStorageLimit(),
        ];

        if ($limitBytes) {
            $result['usage_percentage'] = round(($usedBytes / $limitBytes) * 100, 1);
            $result['available_bytes'] = max(0, $limitBytes - $usedBytes);
            $result['available_mb'] = round($result['available_bytes'] / $mbDivisor, 2);
            $result['is_over_limit'] = $usedBytes > $limitBytes;
        }

        return $result;
    }

    public function getBackupsForStorageCleanup(Server $server): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->getNonFailedBackups($server)
            ->where('is_locked', false)
            ->sortBy('created_at');
    }

    public function calculateStorageFreedByDeletion(\Illuminate\Database\Eloquent\Collection $backups): int
    {
        return (int) $backups->sum(function ($backup) {
            return $backup->isRustic() ? $backup->bytes * 0.3 : $backup->bytes;
        });
    }
}