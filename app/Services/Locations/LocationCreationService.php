<?php

namespace Pterodactyl\Services\Locations;

use Pterodactyl\Models\Location;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationCreationService
{
    public function __construct(protected LocationRepositoryInterface $repository)
    {
    }

    public function handle(array $data): Location
    {
        return $this->repository->create([
            'short' => $data['short'],
            'long' => $data['long'],
            'flag_url' => $data['flag_url'],
            'maximum_servers' => $data['maximum_servers'],
            'required_plans' => $data['required_plans'],
            'required_rank' => $data['required_rank'],
        ]);
    }
}