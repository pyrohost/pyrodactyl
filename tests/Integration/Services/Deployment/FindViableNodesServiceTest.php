<?php

namespace Pterodactyl\Tests\Integration\Services\Deployment;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Database;
use Pterodactyl\Models\Location;
use Illuminate\Support\Collection;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Deployment\FindViableNodesService;
use Pterodactyl\Exceptions\Service\Deployment\NoViableNodeException;

class FindViableNodesServiceTest extends IntegrationTestCase
{
    public function setUp(): void
    {
        parent::setUp();

        Database::query()->delete();
        Server::query()->delete();
        Node::query()->delete();
    }

    public function testExceptionIsThrownIfNoDiskSpaceHasBeenSet()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Disk space must be an int, got NULL');

        $this->getService()->handle();
    }

    public function testExceptionIsThrownIfNoMemoryHasBeenSet()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Memory usage must be an int, got NULL');

        $this->getService()->setDisk(10)->handle();
    }

    /**
     * Ensure that errors are not thrown back when passing in expected values.
     *
     * @see https://github.com/pterodactyl/panel/issues/2529
     */
    public function testNoExceptionIsThrownIfStringifiedIntegersArePassedForLocations()
    {
        $this->getService()->setLocations([1, 2, 3]);
        $this->getService()->setLocations(['1', '2', '3']);
        $this->getService()->setLocations(['1', 2, 3]);

        try {
            $this->getService()->setLocations(['a']);
            $this->fail('This expectation should not be called.');
        } catch (\Exception $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            $this->assertSame('An array of location IDs should be provided when calling setLocations.', $exception->getMessage());
        }

        try {
            $this->getService()->setLocations(['1.2', '1', 2]);
            $this->fail('This expectation should not be called.');
        } catch (\Exception $exception) {
            $this->assertInstanceOf(\InvalidArgumentException::class, $exception);
            $this->assertSame('An array of location IDs should be provided when calling setLocations.', $exception->getMessage());
        }
    }

    public function testExpectedNodeIsReturnedForLocation()
    {
        /** @var \Pterodactyl\Models\Location[] $locations */
        $locations = Location::factory()->times(2)->create();

        /** @var \Pterodactyl\Models\Node[] $nodes */
        $nodes = [
            // This node should never be returned once we've completed the initial test which
            // runs without a location filter.
            Node::factory()->create([
                'location_id' => $locations[0]->id,
                'memory' => 2048,
                'disk' => 1024 * 100,
            ]),
            Node::factory()->create([
                'location_id' => $locations[1]->id,
                'memory' => 1024,
                'disk' => 10240,
                'disk_overallocate' => 10,
            ]),
            Node::factory()->create([
                'location_id' => $locations[1]->id,
                'memory' => 1024 * 4,
                'memory_overallocate' => 50,
                'disk' => 102400,
            ]),
        ];

        // Expect that all the nodes are returned as we're under all of their limits
        // and there is no location filter being provided.
        $response = $this->getService()->setDisk(512)->setMemory(512)->handle();
        $this->assertInstanceOf(Collection::class, $response);
        $this->assertCount(3, $response);
        $this->assertInstanceOf(Node::class, $response[0]);

        // Expect that only the last node is returned because it is the only one with enough
        // memory available to this instance.
        $response = $this->getService()->setDisk(512)->setMemory(2049)->handle();
        $this->assertInstanceOf(Collection::class, $response);
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Helper, I am lazy.
        $base = function () use ($locations) {
            return $this->getService()->setLocations([$locations[1]->id])->setDisk(512);
        };

        // Expect that we can create this server on either node since the disk and memory
        // limits are below the allowed amount.
        $response = $base()->setMemory(512)->handle();
        $this->assertCount(2, $response);
        $this->assertSame(2, $response->where('location_id', $locations[1]->id)->count());

        // Expect that we can only create this server on the second node since the memory
        // allocated is over the amount of memory available to the first node.
        $response = $base()->setMemory(2048)->handle();
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Expect that we can only create this server on the second node since the disk
        // allocated is over the limit assigned to the first node (even with the overallocate).
        $response = $base()->setDisk(20480)->setMemory(256)->handle();
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Expect that we can only create this server on the second node since the first node
        // would require overallocation, and physical capacity is preferred over overallocation.
        // Node 1: 10240 MB disk < 11264 MB (needs overallocation)
        // Node 2: 102400 MB disk > 11264 MB (fits in physical capacity)
        $response = $base()->setDisk(11264)->setMemory(256)->handle();
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Create two servers on the first node so that the disk space used is equal to the
        // base amount available to the node (without overallocation included).
        $servers = Collection::make([
            $this->createServerModel(['node_id' => $nodes[1]->id, 'disk' => 5120]),
            $this->createServerModel(['node_id' => $nodes[1]->id, 'disk' => 5120]),
        ]);

        // Expect that we cannot create a server with a 1GB disk on the first node since there
        // is not enough space (even with the overallocate) available to the node.
        $response = $base()->setDisk(1024)->setMemory(256)->handle();
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Cleanup servers since we need to test some other stuff with memory here.
        $servers->each->delete();

        // Expect that no viable node can be found when the memory limit for the given instance
        // is greater than either node can support, even with the overallocation limits taken
        // into account.
        $this->expectException(NoViableNodeException::class);
        $base()->setMemory(10000)->handle();

        // Create four servers so that the memory used for the second node is equal to the total
        // limit for that node (pre-overallocate calculation).
        Collection::make([
            $this->createServerModel(['node_id' => $nodes[2]->id, 'memory' => 1024]),
            $this->createServerModel(['node_id' => $nodes[2]->id, 'memory' => 1024]),
            $this->createServerModel(['node_id' => $nodes[2]->id, 'memory' => 1024]),
            $this->createServerModel(['node_id' => $nodes[2]->id, 'memory' => 1024]),
        ]);

        // Expect that either node can support this server when we account for the overallocate
        // value of the second node.
        $response = $base()->setMemory(500)->handle();
        $this->assertCount(2, $response);
        $this->assertSame(2, $response->where('location_id', $locations[1]->id)->count());

        // Expect that only the first node can support this server when we go over the remaining
        // memory for the second nodes overallocate calculation.
        $response = $base()->setMemory(640)->handle();
        $this->assertCount(1, $response);
        $this->assertSame($nodes[1]->id, $response[0]->id);
    }

    /**
     * Test that nodes are returned in best-fit order (least leftover capacity first).
     */
    public function testBestFitOrderingPhysicalCapacity()
    {
        $location = Location::factory()->create();

        // Create nodes with different amounts of available capacity
        $nodes = [
            // Node with lots of free space (should be last in best-fit)
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 8192,  // 8GB
                'disk' => 204800,  // 200GB
            ]),
            // Node with moderate free space (should be middle)
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 2048,  // 2GB
                'disk' => 51200,   // 50GB
            ]),
            // Node with least free space (should be first in best-fit)
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 1024,  // 1GB
                'disk' => 10240,   // 10GB
            ]),
        ];

        // Request resources that all nodes can satisfy
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(512)  // 0.5GB
            ->setDisk(5120)   // 5GB
            ->handle();

        $this->assertCount(3, $response);

        // Best-fit order: node with least leftover capacity first
        // Node 2: (1024-512) + (10240-5120) = 512 + 5120 = 5632 total leftover
        // Node 1: (2048-512) + (51200-5120) = 1536 + 46080 = 47616 total leftover
        // Node 0: (8192-512) + (204800-5120) = 7680 + 199680 = 207360 total leftover
        $this->assertSame($nodes[2]->id, $response[0]->id, 'Node with least leftover capacity should be first');
        $this->assertSame($nodes[1]->id, $response[1]->id, 'Node with moderate leftover capacity should be second');
        $this->assertSame($nodes[0]->id, $response[2]->id, 'Node with most leftover capacity should be last');
    }

    /**
     * Test that best-fit ordering works correctly with existing server allocations.
     */
    public function testBestFitOrderingWithExistingServers()
    {
        $location = Location::factory()->create();

        $nodes = [
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 4096,
                'disk' => 102400,
            ]),
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 4096,
                'disk' => 102400,
            ]),
        ];

        // Create servers on nodes to affect available capacity
        $this->createServerModel([
            'node_id' => $nodes[0]->id,
            'memory' => 2048,  // Leaves 2048MB free
            'disk' => 51200,   // Leaves 51200MB free
        ]);

        $this->createServerModel([
            'node_id' => $nodes[1]->id,
            'memory' => 1024,  // Leaves 3072MB free
            'disk' => 25600,   // Leaves 76800MB free
        ]);

        // Request resources that both can satisfy
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(20480)
            ->handle();

        $this->assertCount(2, $response);

        // Calculate leftover capacity after the new allocation:
        // Node 0: (2048-1024) + (51200-20480) = 1024 + 30720 = 31744 leftover
        // Node 1: (3072-1024) + (76800-20480) = 2048 + 56320 = 58368 leftover
        $this->assertSame($nodes[0]->id, $response[0]->id, 'Node 0 should be first (less leftover capacity)');
        $this->assertSame($nodes[1]->id, $response[1]->id, 'Node 1 should be second (more leftover capacity)');
    }

    /**
     * Test the two-pass strategy: physical capacity preferred over overallocation.
     */
    public function testTwoPassStrategy()
    {
        $location = Location::factory()->create();

        $nodes = [
            // Node that can fit with overallocation only
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 1024,
                'memory_overallocate' => 50,  // 50% overallocation = 1536MB total
                'disk' => 10240,
                'disk_overallocate' => 20,    // 20% overallocation = 12288MB total
            ]),
            // Node that can fit with physical capacity
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 2048,  // No overallocation needed
                'memory_overallocate' => 0,
                'disk' => 20480,   // No overallocation needed
                'disk_overallocate' => 0,
            ]),
        ];

        // Request resources that require overallocation on first node but not second
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1200)  // Exceeds node[0] physical (1024) but fits with overallocation (1536)
            ->setDisk(11000)   // Exceeds node[0] physical (10240) but fits with overallocation (12288)
            ->handle();

        // Should prefer node[1] because it can satisfy without overallocation
        $this->assertCount(1, $response);
        $this->assertSame($nodes[1]->id, $response[0]->id, 'Should prefer physical capacity over overallocation');
    }

    /**
     * Test that Pass 2 (overallocation) is used when Pass 1 (physical) fails.
     */
    public function testFallbackToOverallocationPass()
    {
        $location = Location::factory()->create();

        // Create a node that can only satisfy the request with overallocation
        $node = Node::factory()->create([
            'location_id' => $location->id,
            'memory' => 1024,
            'memory_overallocate' => 100,  // 100% overallocation = 2048MB total
            'disk' => 10240,
            'disk_overallocate' => 50,     // 50% overallocation = 15360MB total
        ]);

        // Request resources that exceed physical capacity but fit with overallocation
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1500)  // Exceeds 1024 physical but fits in 2048 with overallocation
            ->setDisk(12000)   // Exceeds 10240 physical but fits in 15360 with overallocation
            ->handle();

        $this->assertCount(1, $response);
        $this->assertSame($node->id, $response[0]->id);
    }

    /**
     * Test pagination functionality.
     */
    public function testPaginationBehavior()
    {
        $location = Location::factory()->create();

        // Create multiple nodes
        $nodes = Node::factory()->count(5)->create([
            'location_id' => $location->id,
            'memory' => 4096,
            'disk' => 102400,
        ]);

        // Test with pagination
        $page1 = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle(2, 1);  // 2 per page, page 1

        $this->assertInstanceOf(\Illuminate\Contracts\Pagination\LengthAwarePaginator::class, $page1);
        $this->assertSame(2, $page1->perPage());
        $this->assertSame(1, $page1->currentPage());
        $this->assertSame(5, $page1->total());
        $this->assertCount(2, $page1->items());

        $page2 = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle(2, 2);  // 2 per page, page 2

        $this->assertSame(2, $page2->currentPage());
        $this->assertCount(2, $page2->items());

        // Test without pagination (should return Collection)
        $all = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle();

        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $all);
        $this->assertCount(5, $all);
    }

    /**
     * Test that only public nodes are returned.
     */
    public function testOnlyPublicNodesReturned()
    {
        $location = Location::factory()->create();

        $publicNode = Node::factory()->create([
            'location_id' => $location->id,
            'public' => true,
            'memory' => 2048,
            'disk' => 51200,
        ]);

        $privateNode = Node::factory()->create([
            'location_id' => $location->id,
            'public' => false,  // Private node
            'memory' => 4096,   // More capacity than public node
            'disk' => 102400,
        ]);

        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle();

        $this->assertCount(1, $response);
        $this->assertSame($publicNode->id, $response[0]->id);
        $this->assertTrue($response[0]->public);
    }

    /**
     * Test that helper columns are stripped from results.
     */
    public function testHelperColumnsAreStripped()
    {
        $location = Location::factory()->create();
        
        $node = Node::factory()->create([
            'location_id' => $location->id,
            'memory' => 2048,
            'disk' => 51200,
        ]);

        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle();

        $this->assertCount(1, $response);
        $nodeResult = $response[0];

        // Verify helper columns are hidden
        $this->assertTrue(in_array('free_memory', $nodeResult->getHidden()));
        $this->assertTrue(in_array('free_disk', $nodeResult->getHidden()));
        
        // Verify we can't access the helper columns
        $this->assertArrayNotHasKey('free_memory', $nodeResult->toArray());
        $this->assertArrayNotHasKey('free_disk', $nodeResult->toArray());
    }

    /**
     * Test edge case with zero memory/disk requirements.
     */
    public function testZeroResourceRequirements()
    {
        $location = Location::factory()->create();
        
        $node = Node::factory()->create([
            'location_id' => $location->id,
            'memory' => 1024,
            'disk' => 10240,
        ]);

        // Create a server using all memory
        $this->createServerModel([
            'node_id' => $node->id,
            'memory' => 1024,
            'disk' => 0,
        ]);

        // Should still be able to create server with 0 memory requirement
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(0)
            ->setDisk(5120)
            ->handle();

        $this->assertCount(1, $response);
        $this->assertSame($node->id, $response[0]->id);
    }

    /**
     * Test complex scenario with multiple nodes and mixed allocations.
     */
    public function testComplexMultiNodeScenario()
    {
        $location = Location::factory()->create();

        // Create nodes with different configurations
        $nodes = [
            // High memory, low disk
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 8192,
                'memory_overallocate' => 25,
                'disk' => 20480,
                'disk_overallocate' => 0,
            ]),
            // Balanced resources
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 4096,
                'memory_overallocate' => 50,
                'disk' => 102400,
                'disk_overallocate' => 20,
            ]),
            // Low memory, high disk
            Node::factory()->create([
                'location_id' => $location->id,
                'memory' => 2048,
                'memory_overallocate' => 0,
                'disk' => 204800,
                'disk_overallocate' => 10,
            ]),
        ];

        // Add existing servers to create varied usage patterns
        $this->createServerModel(['node_id' => $nodes[0]->id, 'memory' => 4096, 'disk' => 10240]);
        $this->createServerModel(['node_id' => $nodes[1]->id, 'memory' => 2048, 'disk' => 51200]);
        $this->createServerModel(['node_id' => $nodes[2]->id, 'memory' => 1024, 'disk' => 102400]);

        // Test memory-heavy allocation
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(3072)  // 3GB
            ->setDisk(10240)   // 10GB
            ->handle();

        // Only node[0] can satisfy this (4096 remaining memory)
        $this->assertCount(1, $response);
        $this->assertSame($nodes[0]->id, $response[0]->id);

        // Test disk-heavy allocation
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)   // 1GB
            ->setDisk(92160)    // 90GB
            ->handle();

        // Only node[2] can satisfy this (102400 remaining disk)
        $this->assertCount(1, $response);
        $this->assertSame($nodes[2]->id, $response[0]->id);

        // Test balanced allocation that multiple nodes can handle
        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)   // 1GB
            ->setDisk(5120)     // 5GB
            ->handle();

        // All nodes should be able to handle this, verify best-fit ordering
        $this->assertCount(3, $response);
        
        // Calculate expected leftover for each node:
        // Node 0: (4096-1024) + (10240-5120) = 3072 + 5120 = 8192
        // Node 1: (2048-1024) + (51200-5120) = 1024 + 46080 = 47104
        // Node 2: (1024-1024) + (102400-5120) = 0 + 97280 = 97280
        
        $this->assertSame($nodes[0]->id, $response[0]->id, 'Node 0 should have least leftover capacity');
    }

    /**
     * Test location filtering with empty location array.
     */
    public function testEmptyLocationFilterReturnsAllNodes()
    {
        $locations = Location::factory()->count(2)->create();
        
        $nodes = [
            Node::factory()->create(['location_id' => $locations[0]->id, 'memory' => 2048, 'disk' => 51200]),
            Node::factory()->create(['location_id' => $locations[1]->id, 'memory' => 2048, 'disk' => 51200]),
        ];

        // Empty locations array should return nodes from all locations
        $response = $this->getService()
            ->setLocations([])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle();

        $this->assertCount(2, $response);
        $locationIds = $response->pluck('location_id')->sort()->values();
        $this->assertSame([$locations[0]->id, $locations[1]->id], $locationIds->toArray());
    }

    /**
     * Test default pagination size.
     */
    public function testDefaultPaginationSize()
    {
        $location = Location::factory()->create();
        
        // Create more nodes than default page size
        Node::factory()->count(60)->create([
            'location_id' => $location->id,
            'memory' => 2048,
            'disk' => 51200,
        ]);

        $response = $this->getService()
            ->setLocations([$location->id])
            ->setMemory(1024)
            ->setDisk(10240)
            ->handle(null, 1);  // Use default per_page

        $this->assertInstanceOf(\Illuminate\Contracts\Pagination\LengthAwarePaginator::class, $response);
        $this->assertSame(FindViableNodesService::DEFAULT_PER_PAGE, $response->perPage());
        $this->assertSame(60, $response->total());
        $this->assertCount(50, $response->items());  // First page should have 50 items
    }
    
    private function getService(): FindViableNodesService
    {
        return $this->app->make(FindViableNodesService::class);
    }
}
