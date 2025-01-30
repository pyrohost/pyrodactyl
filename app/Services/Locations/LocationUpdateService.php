<?php

namespace Pterodactyl\Services\Locations;

use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationUpdateService
{
    public function __construct(protected LocationRepositoryInterface $repository)
    {
    }

    public function handle(int $id, array $data): void
    {
        $updateData = [];
        
        // Only include fields that exist in the data array
        if (isset($data['short'])) $updateData['short'] = $data['short'];
        if (isset($data['long'])) $updateData['long'] = $data['long'];
        if (array_key_exists('flag_url', $data)) $updateData['flag_url'] = $data['flag_url'];
        if (isset($data['maximum_servers'])) $updateData['maximum_servers'] = (int) $data['maximum_servers'];
        if (isset($data['required_plans'])) $updateData['required_plans'] = $data['required_plans'];
        if (isset($data['required_rank'])) $updateData['required_rank'] =  $data['required_rank'];

        if (!empty($updateData)) {
            $this->repository->update($id, $updateData);
        }
    }
}