<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Nests;

use Pterodactyl\Models\Nest;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Transformers\Api\Client\NestTransformer;
use Pterodactyl\Http\Requests\Api\Application\Nests\GetNestsRequest;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;

class NestController extends ClientApiController
{
    /**
     * NestController constructor.
     */
    public function __construct(private NestRepositoryInterface $repository)
    {
        parent::__construct();
    }

    /**
     * Return all Nests that exist on the Panel.
     */
    public function index(): array
    {
        $nests = $this->repository->all();

        return $this->fractal->collection($nests)
        ->transformWith($this->getTransformer(NestTransformer::class))
        ->toArray();
    }

    /**
     * Return information about a single Nest model.
     */
    public function view(GetNestsRequest $request, Nest $nest): array
    {
        return $this->fractal->item($nest)
            ->transformWith($this->getTransformer(NestTransformer::class))
            ->toArray();
    }
}
