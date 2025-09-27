<?php

namespace Pterodactyl\Repositories\Elytra;

use GuzzleHttp\Client;
use Pterodactyl\Models\Node;
use Webmozart\Assert\Assert;
use Pterodactyl\Models\Backup;
use Pterodactyl\Models\Server;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\TransferException;
use Illuminate\Contracts\Foundation\Application;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * Repository for communicating with the Elytra daemon
 * Replaces the Wings DaemonBackupRepository functionality
 */
class ElytraRepository
{
    protected ?Server $server;
    protected ?Node $node;

    public function __construct(protected Application $app)
    {
    }

    /**
     * Set the server model this request is stemming from.
     */
    public function setServer(Server $server): self
    {
        $this->server = $server;
        $this->setNode($this->server->node);

        return $this;
    }

    /**
     * Set the node model this request is stemming from.
     */
    public function setNode(Node $node): self
    {
        $this->node = $node;

        return $this;
    }

    /**
     * Return an instance of the Guzzle HTTP Client to be used for requests.
     */
    public function getHttpClient(array $headers = []): Client
    {
        Assert::isInstanceOf($this->node, Node::class);

        return new Client([
            'verify' => $this->app->environment('production'),
            'base_uri' => $this->node->getConnectionAddress(),
            'timeout' => config('pterodactyl.guzzle.timeout'),
            'connect_timeout' => config('pterodactyl.guzzle.connect_timeout'),
            'headers' => array_merge($headers, [
                'Authorization' => 'Bearer ' . $this->node->getDecryptedKey(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ]),
        ]);
    }

    /**
     * Create a new job on Elytra
     *
     * @throws DaemonConnectionException
     */
    public function createJob(string $jobType, array $jobData): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient(['timeout' => 30])->post(
                sprintf('/api/servers/%s/jobs', $this->server->uuid),
                [
                    'json' => [
                        'job_type' => $jobType,
                        'job_data' => $jobData,
                    ],
                ]
            );

            return json_decode($response->getBody()->getContents(), true);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Gets the current status of a job from Elytra
     *
     * @throws DaemonConnectionException
     */
    public function getJobStatus(string $jobId): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient(['timeout' => 5])->get(
                sprintf('/api/servers/%s/jobs/%s', $this->server->uuid, $jobId)
            );

            return json_decode($response->getBody()->getContents(), true);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Cancels a running job on Elytra
     *
     * @throws DaemonConnectionException
     */
    public function cancelJob(string $jobId): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient(['timeout' => 5])->delete(
                sprintf('/api/servers/%s/jobs/%s', $this->server->uuid, $jobId)
            );

            return json_decode($response->getBody()->getContents(), true);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }

    /**
     * Update job status on Elytra
     *
     * @throws DaemonConnectionException
     */
    public function updateJob(string $jobId, string $status, int $progress = 0, string $message = '', array $result = null): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $data = [
                'status' => $status,
                'progress' => $progress,
                'message' => $message,
            ];

            if ($result !== null) {
                $data['result'] = $result;
            }

            $response = $this->getHttpClient(['timeout' => 5])->put(
                sprintf('/api/servers/%s/jobs/%s', $this->server->uuid, $jobId),
                ['json' => $data]
            );

            return json_decode($response->getBody()->getContents(), true);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}