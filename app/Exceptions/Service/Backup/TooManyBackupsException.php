<?php

namespace Pterodactyl\Exceptions\Service\Backup;

use Pterodactyl\Exceptions\DisplayException;

class TooManyBackupsException extends DisplayException
{
    /**
     * TooManyBackupsException constructor.
     */
    public function __construct(int $backupLimit, ?string $customMessage = null)
    {
        $message = $customMessage ?? sprintf('Cannot create a new backup, this server has reached its limit of %d backups.', $backupLimit);
        parent::__construct($message);
    }
}
