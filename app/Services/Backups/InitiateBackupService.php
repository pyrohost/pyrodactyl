<?php

namespace Pterodactyl\Services\Backups;

use Ramsey\Uuid\Uuid;
use Webmozart\Assert\Assert;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Repositories\Eloquent\BackupRepository;
use Pterodactyl\Repositories\Wings\DaemonBackupRepository;
use Pterodactyl\Services\Backups\BackupStorageService;
use Pterodactyl\Exceptions\Service\Backup\TooManyBackupsException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Carbon\CarbonImmutable;

class InitiateBackupService
{
    private ?array $ignoredFiles;

    private bool $isLocked = false;


    /**
     * InitiateBackupService constructor.
     */
    public function __construct(
        private BackupRepository $repository,
        private ConnectionInterface $connection,
        private DaemonBackupRepository $daemonBackupRepository,
        private DeleteBackupService $deleteBackupService,
        private BackupManager $backupManager,
        private ServerStateService $serverStateService,
        private BackupStorageService $backupStorageService,
    ) {
    }

    /**
     * Set if the backup should be locked once it is created which will prevent
     * its deletion by users or automated system processes.
     */
    public function setIsLocked(bool $isLocked): self
    {
        $this->isLocked = $isLocked;

        return $this;
    }


    /**
     * Sets the files to be ignored by this backup.
     *
     * @param string[]|null $ignored
     */
    public function setIgnoredFiles(?array $ignored): self
    {
        if (is_array($ignored)) {
            foreach ($ignored as $value) {
                Assert::string($value);
            }
        }

        // Set the ignored files to be any values that are not empty in the array. Don't use
        // the PHP empty function here incase anything that is "empty" by default (0, false, etc.)
        // were passed as a file or folder name.
        $this->ignoredFiles = is_null($ignored) ? [] : array_filter($ignored, function ($value) {
            return strlen($value) > 0;
        });

        return $this;
    }

    /**
     * Initiates the backup process for a server on Wings.
     *
     * @throws \Throwable
     * @throws TooManyBackupsException
     * @throws TooManyRequestsHttpException
     */
    public function handle(Server $server, ?string $name = null, bool $override = false): Backup
    {
        // Validate server state before creating backup
        $this->validateServerForBackup($server);
        
        // Check for existing backups in progress (only allow one at a time)
        $inProgressBackups = $this->repository->getBackupsInProgress($server->id);
        if ($inProgressBackups->count() > 0) {
            throw new TooManyRequestsHttpException(30, 'A backup is already in progress. Please wait for it to complete before starting another.');
        }

        $successful = $this->repository->getNonFailedBackups($server);

        if (!$server->allowsBackups()) {
            throw new TooManyBackupsException(0, 'Backups are disabled for this server');
        }

        // Block backup creation if already over storage limit
        if ($server->hasBackupStorageLimit() && $this->backupStorageService->isOverStorageLimit($server)) {
            $usage = $this->backupStorageService->getStorageUsageInfo($server);
            throw new TooManyBackupsException(0, sprintf(
                'Cannot create backup: server is already over storage limit (%.2fMB used of %.2fMB limit). Please delete old backups first.',
                $usage['used_mb'],
                $usage['limit_mb']
            ));
        }
        elseif ($server->hasBackupCountLimit() && $successful->count() >= $server->backup_limit) {
            if (!$override) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            $oldest = $successful->where('is_locked', false)->orderBy('created_at')->first();
            if (!$oldest) {
                throw new TooManyBackupsException($server->backup_limit);
            }

            $this->deleteBackupService->handle($oldest);
        }

        return $this->connection->transaction(function () use ($server, $name) {
            $backupName = trim($name) ?: sprintf('Backup at %s', CarbonImmutable::now()->toDateTimeString());
            $backupName = preg_replace('/[^a-zA-Z0-9\s\-_\.]/', '', $backupName);
            $backupName = substr($backupName, 0, 191); // Limit to database field length

            $serverState = $this->serverStateService->captureServerState($server);

            // Use the configured default adapter
            $adapter = $this->backupManager->getDefaultAdapter();


            /** @var Backup $backup */
            $backup = $this->repository->create([
                'server_id' => $server->id,
                'uuid' => Uuid::uuid4()->toString(),
                'name' => $backupName,
                'ignored_files' => array_values($this->ignoredFiles ?? []),
                'disk' => $adapter,
                'is_locked' => $this->isLocked,
                'server_state' => $serverState,
            ], true, true);

            try {
                $this->daemonBackupRepository->setServer($server)
                    ->setBackupAdapter($adapter)
                    ->backup($backup);
            } catch (\Exception $e) {
                // If daemon backup request fails, clean up the backup record
                $backup->delete();
                throw $e;
            }

            return $backup;
        });
    }

    /**
     * Validate that the server is in a valid state for backup creation
     */
    private function validateServerForBackup(Server $server): void
    {
        if ($server->isSuspended()) {
            throw new TooManyBackupsException(0, 'Cannot create backup for suspended server.');
        }
        
        if (!$server->isInstalled()) {
            throw new TooManyBackupsException(0, 'Cannot create backup for server that is not fully installed.');
        }
        
        if ($server->status === Server::STATUS_RESTORING_BACKUP) {
            throw new TooManyBackupsException(0, 'Cannot create backup while server is restoring from another backup.');
        }
        
        if ($server->transfer) {
            throw new TooManyBackupsException(0, 'Cannot create backup while server is being transferred.');
        }
    }

}
