<?php

namespace Pterodactyl\Repositories\Wings;

use Webmozart\Assert\Assert;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\TransferException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * @method \Pterodactyl\Repositories\Wings\DaemonBackupRepository setNode(\Pterodactyl\Models\Node $node)
 * @method \Pterodactyl\Repositories\Wings\DaemonBackupRepository setServer(\Pterodactyl\Models\Server $server)
 */
class DaemonBackupRepository extends DaemonRepository
{
    protected ?string $adapter;

    /**
     * Sets the backup adapter for this execution instance.
     */
    public function setBackupAdapter(string $adapter): self
    {
        $this->adapter = $adapter;

        return $this;
    }

    /**
     * Tells the remote Daemon to begin generating a backup for the server (async).
     * Returns the response which should contain a job_id for tracking.
     *
     * @throws DaemonConnectionException
     */
    public function backup(Backup $backup): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $adapterToSend = $this->adapter ?? config('backups.default');

            return $this->getHttpClient(['timeout' => 10])->post(
                sprintf('/api/servers/%s/backup', $this->server->uuid),
                [
                    'json' => [
                        'adapter' => $adapterToSend,
                        'uuid' => $backup->uuid,
                        'ignore' => implode("\n", $backup->ignored_files),
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Sends a request to Wings to begin restoring a backup for a server.
     * Always truncates the directory for a clean restore.
     *
     * @throws DaemonConnectionException
     */
    public function restore(Backup $backup, ?string $url = null): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient(['timeout' => 5])->post(
                sprintf('/api/servers/%s/backup/%s/restore', $this->server->uuid, $backup->uuid),
                [
                    'json' => [
                        'adapter' => $backup->disk,
                        'truncate_directory' => true,
                        'download_url' => $url ?? '',
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Deletes a backup from the daemon (async).
     * Returns the response which should contain a job_id for tracking.
     *
     * @throws DaemonConnectionException
     */
    public function delete(Backup $backup): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient(['timeout' => 10])->delete(
                sprintf('/api/servers/%s/backup/%s', $this->server->uuid, $backup->uuid),
                [
                    'json' => [
                        'adapter_type' => $backup->getElytraAdapterType(),
                    ],
                ]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Gets the current status of a job from Elytra
     *
     * @throws DaemonConnectionException
     */
    public function getJobStatus(string $jobId): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient(['timeout' => 5])->get(
                sprintf('/api/servers/%s/jobs/%s', $this->server->uuid, $jobId)
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Cancels a running job on Elytra
     *
     * @throws DaemonConnectionException
     */
    public function cancelJob(string $jobId): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient(['timeout' => 5])->delete(
                sprintf('/api/servers/%s/jobs/%s', $this->server->uuid, $jobId)
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Lists all jobs for a server on Elytra
     *
     * @throws DaemonConnectionException
     */
    public function listJobs(?string $status = null, ?string $type = null): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $query = [];
            if ($status) $query['status'] = $status;
            if ($type) $query['type'] = $type;

            $url = sprintf('/api/servers/%s/jobs', $this->server->uuid);
            if (!empty($query)) {
                $url .= '?' . http_build_query($query);
            }

            return $this->getHttpClient(['timeout' => 5])->get($url);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}
