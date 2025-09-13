<?php

namespace Pterodactyl\Repositories\Eloquent;

use Pterodactyl\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationRepository extends EloquentRepository implements LocationRepositoryInterface
{
    /**
     * Return the model backing this repository.
     */
    public function model(): string
    {
        return Location::class;
    }

    /**
     * Return locations with a count of nodes and servers attached to it.
     */
    public function getAllWithDetails(): Collection
    {
        $locations = $this->getBuilder()->withCount('nodes', 'servers')->get($this->getColumns());

        foreach ($locations as $location) {
            $nodes = $location->nodes()->with('servers')->get();

            $totalMemory = 0;
            $allocatedMemory = 0;
            $totalDisk = 0;
            $allocatedDisk = 0;

            foreach ($nodes as $node) {
                $baseMemoryLimit = $node->memory;
                $baseDiskLimit = $node->disk;
                $memoryLimit = $baseMemoryLimit * (1 + ($node->memory_overallocate / 100));
                $diskLimit = $baseDiskLimit * (1 + ($node->disk_overallocate / 100));
    
                $totalMemory += $memoryLimit;
                $totalDisk += $diskLimit;
    
                $nodeAllocatedMemory = $node->servers->where('exclude_from_resource_calculation', false)->sum('memory');
                $nodeAllocatedDisk = $node->servers->where('exclude_from_resource_calculation', false)->sum('disk');
    
                $allocatedMemory += $nodeAllocatedMemory;
                $allocatedDisk += $nodeAllocatedDisk;
            }
    
            $totalBaseMemory = $nodes->sum('memory');
            $totalBaseDisk = $nodes->sum('disk');
            
            $location->memory_percent = $totalBaseMemory > 0 ? ($allocatedMemory / $totalBaseMemory) * 100 : 0;
            $location->disk_percent = $totalBaseDisk > 0 ? ($allocatedDisk / $totalBaseDisk) * 100 : 0;
    
            $location->total_memory = $totalMemory;
            $location->allocated_memory = $allocatedMemory;
            $location->total_disk = $totalDisk;
            $location->allocated_disk = $allocatedDisk;
        }

        return $locations;
    }

    /**
     * Return all the available locations with the nodes as a relationship.
     */
    public function getAllWithNodes(): Collection
    {
        return $this->getBuilder()->with('nodes')->get($this->getColumns());
    }

    /**
     * Return all the nodes and their respective count of servers for a location.
     *
     * @throws RecordNotFoundException
     */
    public function getWithNodes(int $id): Location
    {
        try {
            return $this->getBuilder()->with('nodes.servers')->findOrFail($id, $this->getColumns());
        } catch (ModelNotFoundException) {
            throw new RecordNotFoundException();
        }
    }

    /**
     * Return a location and the count of nodes in that location.
     *
     * @throws RecordNotFoundException
     */
    public function getWithNodeCount(int $id): Location
    {
        try {
            return $this->getBuilder()->withCount('nodes')->findOrFail($id, $this->getColumns());
        } catch (ModelNotFoundException) {
            throw new RecordNotFoundException();
        }
    }
}
