<?php

namespace Pterodactyl\Services\Deployment;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Pterodactyl\Exceptions\Service\Deployment\NoViableNodeException;
use Pterodactyl\Models\Node;
use Webmozart\Assert\Assert;

/**
 * Finds nodes that can host a new server, always preferring *physical* capacity
 * over overallocation. The search runs in two passes with different ordering strategies:
 *
 *  Pass 1 (Physical Capacity)
 *      Ignore memory/disk overallocation completely. If any node can fit
 *      the server within its physical limit, choose the best-fit result(s)
 *      (least leftover capacity first) for efficient resource usage.
 *
 *  Pass 2 (Overallocation Fallback)
 *      Only executed when Pass 1 returns zero rows. Re-runs the query but
 *      includes each node's configured overallocation allowances. Uses
 *      worst-fit ordering (most leftover capacity first) to spread load
 *      across nodes when overallocation is involved.
 *
 */
class FindViableNodesService
{
    private array $locations = [];
    private ?int $memory = null;
    private ?int $disk   = null;

    /** Default paginator size when `$perPage` is omitted. */
    public const DEFAULT_PER_PAGE = 50;

    /** Restrict the search to these location IDs. */
    public function setLocations(array $locations): self
    {
        Assert::allIntegerish(
            $locations,
            'An array of location IDs should be provided when calling setLocations.'
        );

        $this->locations = array_unique($locations);

        return $this;
    }

    /** Memory (in MB) required by the server being provisioned. */
    public function setMemory(int $memory): self
    {
        $this->memory = $memory;
        return $this;
    }

    /** Disk (in MB) required by the server being provisioned. */
    public function setDisk(int $disk): self
    {
        $this->disk = $disk;
        return $this;
    }

    /**
     * Locate viable nodes using the two-pass strategy outlined above.
     *
     * @throws NoViableNodeException
     */
    public function handle(?int $perPage = null, ?int $page = null): LengthAwarePaginator|Collection
    {
        Assert::integer($this->disk,  'Disk space must be an int, got NULL');
        Assert::integer($this->memory,'Memory usage must be an int, got NULL');

        $perPage = $perPage ?? self::DEFAULT_PER_PAGE;

        // Pass 1: physical capacity only
        $results = $this->runQuery(false, $perPage, $page);

        // Pass 2: allow overallocation if Pass 1 failed
        if ($results->isEmpty()) {
            $results = $this->runQuery(true, $perPage, $page);
        }

        if ($results->isEmpty()) {
            throw new NoViableNodeException(trans('exceptions.deployment.no_viable_nodes'));
        }

        return $results;
    }

    /**
     * Build and execute a query.
     *
     * @param bool      $allowOverallocation  Treat overallocate percentage as
     *                                        extra capacity when true.
     * @param int|null  $perPage              Paginator size (null = no paging).
     * @param int|null  $page                 Page number when paginating.
     */
    private function runQuery(
        bool $allowOverallocation,
        ?int $perPage,
        ?int $page
    ): LengthAwarePaginator|Collection {
        $memCap  = $allowOverallocation
            ? '(nodes.memory * (1 + nodes.memory_overallocate / 100.0))'
            : 'nodes.memory';

        $diskCap = $allowOverallocation
            ? '(nodes.disk * (1 + nodes.disk_overallocate / 100.0))'
            : 'nodes.disk';

        /** @var Builder $query */
        $query = Node::query()
            ->select('nodes.*')
            ->selectRaw(
                "$memCap  - COALESCE(SUM(servers.memory), 0) AS free_memory, " .
                "$diskCap - COALESCE(SUM(servers.disk),   0) AS free_disk"
            )
            ->leftJoin('servers', function ($join) {
                $join->on('servers.node_id', '=', 'nodes.id')
                     ->where('servers.exclude_from_resource_calculation', '=', false);
            })
            ->where('nodes.public', true)
            ->when(
                $this->locations !== [],
                fn (Builder $q) => $q->whereIn('nodes.location_id', $this->locations)
            )
            ->groupBy('nodes.id')

            // Capacity filters
            ->havingRaw("$memCap  - COALESCE(SUM(servers.memory), 0) >= ?", [$this->memory])
            ->havingRaw("$diskCap - COALESCE(SUM(servers.disk),   0) >= ?", [$this->disk])

            // Ordering strategy: best-fit for physical capacity, worst-fit for overallocation
            ->orderByRaw(
                "($memCap - COALESCE(SUM(servers.memory), 0) + " .
                "$diskCap - COALESCE(SUM(servers.disk), 0)) " .
                ($allowOverallocation ? 'DESC' : 'ASC')
            );

        // Execute and strip helper columns
        $results = $page !== null
            ? /** @var LengthAwarePaginator $paginator */ $query->paginate($perPage, ['*'], 'page', $page)
            : /** @var EloquentCollection $collection */ $query->get();

        $strip = static fn (Node $node) => $node->setHidden(['free_memory', 'free_disk']);

        if ($results instanceof LengthAwarePaginator) {
            $results->getCollection()->each($strip);
        } else {
            $results = $results->map($strip);
        }

        return $results;
    }
}
