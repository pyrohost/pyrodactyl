<?php


namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Carbon\Carbon;
use Pterodactyl\Models\Server;
use Illuminate\Cache\Repository;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Pterodactyl\Transformers\Api\Client\StatsTransformer;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;

class ResourceUtilizationController extends ClientApiController
{
    /**
     * ResourceUtilizationController constructor.
     */
    public function __construct(private Repository $cache, private DaemonServerRepository $repository)
    {
        parent::__construct();
    }

    /**
     * Return the current resource utilization for a server. This value is cached for up to
     * 20 seconds at a time to ensure that repeated requests to this endpoint do not cause
     * a flood of unnecessary API calls.
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function __invoke(GetServerRequest $request, Server $server): array
    {
        $key = "resources:$server->uuid";
        $stats = $this->cache->remember($key, Carbon::now()->addSeconds(20), function () use ($server) {
            return $this->repository->setServer($server)->getDetails();
        });

        return $this->fractal->item($stats)
            ->transformWith($this->getTransformer(StatsTransformer::class))
            ->toArray();
    }

    public function stream(GetServerRequest $request, Server $server): StreamedResponse 
    {
        return new StreamedResponse(function () use ($server) {
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no');

            while (true) {
                $key = "resources:$server->uuid";
                $stats = $this->cache->remember($key, Carbon::now()->addSeconds(5), function () use ($server) {
                    return $this->repository->setServer($server)->getDetails();
                });

                $transformed = $this->fractal->item($stats)
                    ->transformWith($this->getTransformer(StatsTransformer::class))
                    ->toArray();

                echo "data: " . json_encode($transformed) . "\n\n";
                ob_flush();
                flush();
                sleep(1);
            }
        });
    }
}
