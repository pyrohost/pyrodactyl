<?php

namespace Pterodactyl\Tests\Integration\Services\Deployment;

use Pterodactyl\Models\Node;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Services\Deployment\FindViableNodesService;
use Pterodactyl\Exceptions\Service\Deployment\NoViableNodeException;

class FindViableNodesServiceTest extends IntegrationTestCase
{
    private FindViableNodesService $service;
    private Location $location;

    public function setUp(): void
    {
        parent::setUp();

        // Clean slate for each test
        Server::query()->delete();
        Node::query()->delete();
        Location::query()->delete();

        $this->service = $this->app->make(FindViableNodesService::class);
        $this->location = Location::factory()->create();
    }

    // =================================================================
    // BASIC FUNCTIONALITY AND VALIDATION TESTS
    // =================================================================

    public function test_requires_disk_parameter()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Disk space must be an int, got NULL');

        $this->service->handle();
    }

    public function test_requires_memory_parameter()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Memory usage must be an int, got NULL');

        $this->service->setDisk(1024)->handle();
    }

    public function test_accepts_string_location_ids()
    {
        // Should not throw exceptions
        $this->service->setLocations([1, 2, 3]);
        $this->service->setLocations(['1', '2', '3']);
        $this->service->setLocations(['1', 2, 3]);

        $this->expectException(\InvalidArgumentException::class);
        $this->service->setLocations(['invalid']);
    }

    public function test_throws_exception_when_no_viable_nodes_found()
    {
        $this->expectException(NoViableNodeException::class);
        
        $this->service
            ->setMemory(1024)
            ->setDisk(1024)
            ->handle();
    }

    // =================================================================
    // TWO-PASS STRATEGY TESTS
    // =================================================================

    public function test_prefers_physical_capacity_over_overallocation()
    {
        $physicalNode = $this->createNode([
            'memory' => 2048,
            'disk' => 20480,
            'memory_overallocate' => 0,
            'disk_overallocate' => 0,
        ]);

        $overallocationNode = $this->createNode([
            'memory' => 1024,
            'disk' => 10240,
            'memory_overallocate' => 100, // 2048 total
            'disk_overallocate' => 100,   // 20480 total
        ]);

        // Request that fits both but requires overallocation on second node
        $result = $this->service
            ->setMemory(1500)
            ->setDisk(15000)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($physicalNode->id, $result->first()->id);
    }

    public function test_falls_back_to_overallocation_when_physical_capacity_insufficient()
    {
        $node = $this->createNode([
            'memory' => 1024,
            'disk' => 10240,
            'memory_overallocate' => 50, // 1536 total
            'disk_overallocate' => 50,   // 15360 total
        ]);

        // Request that exceeds physical but fits with overallocation
        $result = $this->service
            ->setMemory(1200)
            ->setDisk(12000)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($node->id, $result->first()->id);
    }

    // =================================================================
    // ORDERING STRATEGY
    // =================================================================

    public function test_physical_capacity_uses_best_fit_ordering()
    {
        // Create nodes with different amounts of free capacity
        $smallNode = $this->createNode(['memory' => 1024, 'disk' => 10240]);
        $mediumNode = $this->createNode(['memory' => 2048, 'disk' => 20480]);
        $largeNode = $this->createNode(['memory' => 4096, 'disk' => 40960]);

        // Request that all can satisfy with physical capacity
        $result = $this->service
            ->setMemory(512)
            ->setDisk(5120)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(3, $result);
        
        // Should be ordered by least leftover capacity (best-fit)
        // Small: (1024-512) + (10240-5120) = 512 + 5120 = 5632 leftover
        // Medium: (2048-512) + (20480-5120) = 1536 + 15360 = 16896 leftover  
        // Large: (4096-512) + (40960-5120) = 3584 + 35840 = 39424 leftover
        $this->assertEquals($smallNode->id, $result[0]->id);
        $this->assertEquals($mediumNode->id, $result[1]->id);
        $this->assertEquals($largeNode->id, $result[2]->id);
    }

    public function test_overallocation_mode_uses_worst_fit_ordering()
    {
        // Create nodes where physical capacity is insufficient but overallocation works
        $smallNode = $this->createNode([
            'memory' => 512, 
            'disk' => 5120,
            'memory_overallocate' => 100, // 1024 total
            'disk_overallocate' => 100,   // 10240 total
        ]);
        
        $mediumNode = $this->createNode([
            'memory' => 512,
            'disk' => 5120, 
            'memory_overallocate' => 300, // 2048 total
            'disk_overallocate' => 300,   // 20480 total
        ]);
        
        $largeNode = $this->createNode([
            'memory' => 512,
            'disk' => 5120,
            'memory_overallocate' => 700, // 4096 total  
            'disk_overallocate' => 700,   // 40960 total
        ]);

        // Request that requires overallocation on all nodes
        $result = $this->service
            ->setMemory(600)
            ->setDisk(6000)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(3, $result);
        
        // Should be ordered by most leftover capacity (worst-fit)
        // Small: (1024-600) + (10240-6000) = 424 + 4240 = 4664 leftover
        // Medium: (2048-600) + (20480-6000) = 1448 + 14480 = 15928 leftover
        // Large: (4096-600) + (40960-6000) = 3496 + 34960 = 38456 leftover
        $this->assertEquals($largeNode->id, $result[0]->id);
        $this->assertEquals($mediumNode->id, $result[1]->id);
        $this->assertEquals($smallNode->id, $result[2]->id);
    }

    public function test_ordering_with_existing_server_allocations()
    {
        $node1 = $this->createNode(['memory' => 4096, 'disk' => 40960]);
        $node2 = $this->createNode(['memory' => 4096, 'disk' => 40960]);

        // Add existing servers to change available capacity
        $this->createServer(['node_id' => $node1->id, 'memory' => 2048, 'disk' => 20480]);
        $this->createServer(['node_id' => $node2->id, 'memory' => 1024, 'disk' => 10240]);

        // Physical capacity test (best-fit)
        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        // Node1: (2048-1024) + (20480-10240) = 1024 + 10240 = 11264 leftover
        // Node2: (3072-1024) + (30720-10240) = 2048 + 20480 = 22528 leftover
        $this->assertEquals($node1->id, $result[0]->id);
        $this->assertEquals($node2->id, $result[1]->id);
    }

    // =================================================================
    // CAPACITY CALCULATION TESTS
    // =================================================================

    public function test_physical_capacity_calculations()
    {
        $node = $this->createNode([
            'memory' => 1024,
            'disk' => 10240,
            'memory_overallocate' => 50,
            'disk_overallocate' => 50,
        ]);

        // Request exactly at physical limit
        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($node->id, $result->first()->id);
    }

    public function test_overallocation_capacity_calculations()
    {
        $node = $this->createNode([
            'memory' => 1024,
            'disk' => 10240,
            'memory_overallocate' => 50, // 1536 total
            'disk_overallocate' => 50,   // 15360 total
        ]);

        // Request exactly at overallocation limit should work
        $result = $this->service
            ->setMemory(1536)
            ->setDisk(15360)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($node->id, $result->first()->id);

        // But exceeding overallocation limit should fail
        $this->expectException(NoViableNodeException::class);
        $this->service
            ->setMemory(1600)
            ->setDisk(16000)
            ->setLocations([$this->location->id])
            ->handle();
    }

    public function test_capacity_with_existing_servers()
    {
        $node = $this->createNode([
            'memory' => 2048,
            'disk' => 20480,
            'memory_overallocate' => 0,
            'disk_overallocate' => 0,
        ]);

        $this->createServer(['node_id' => $node->id, 'memory' => 1024, 'disk' => 10240]);

        // Should be able to allocate remaining capacity
        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
    }

    // =================================================================
    // FILTERING TESTS
    // =================================================================

    public function test_location_filtering()
    {
        $location2 = Location::factory()->create();
        
        $node1 = $this->createNode(['memory' => 2048, 'disk' => 20480], $this->location);
        $node2 = $this->createNode(['memory' => 2048, 'disk' => 20480], $location2);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($node1->id, $result->first()->id);
    }

    public function test_empty_location_filter_returns_all_nodes()
    {
        $location2 = Location::factory()->create();
        
        $this->createNode(['memory' => 2048, 'disk' => 20480], $this->location);
        $this->createNode(['memory' => 2048, 'disk' => 20480], $location2);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([])
            ->handle();

        $this->assertCount(2, $result);
    }

    public function test_only_public_nodes_returned()
    {
        $publicNode = $this->createNode(['memory' => 2048, 'disk' => 20480, 'public' => true]);
        $this->createNode(['memory' => 4096, 'disk' => 40960, 'public' => false]);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($publicNode->id, $result->first()->id);
        $this->assertTrue($result->first()->public);
    }

    // =================================================================
    // PAGINATION TESTS
    // =================================================================

    public function test_pagination_behavior()
    {
        // Create multiple nodes
        Node::factory()->count(5)->create([
            'location_id' => $this->location->id,
            'memory' => 2048,
            'disk' => 20480,
        ]);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle(2, 1);

        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertEquals(2, $result->perPage());
        $this->assertEquals(1, $result->currentPage());
        $this->assertEquals(5, $result->total());
        $this->assertCount(2, $result->items());
    }

    public function test_default_pagination_size()
    {
        Node::factory()->count(60)->create([
            'location_id' => $this->location->id,
            'memory' => 2048,
            'disk' => 20480,
        ]);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle(null, 1);

        $this->assertInstanceOf(LengthAwarePaginator::class, $result);
        $this->assertEquals(FindViableNodesService::DEFAULT_PER_PAGE, $result->perPage());
        $this->assertEquals(60, $result->total());
        $this->assertCount(50, $result->items());
    }

    public function test_returns_collection_when_not_paginating()
    {
        Node::factory()->count(3)->create([
            'location_id' => $this->location->id,
            'memory' => 2048,
            'disk' => 20480,
        ]);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertInstanceOf(Collection::class, $result);
        $this->assertCount(3, $result);
    }

    // =================================================================
    // EDGE CASES AND INTEGRATION TESTS
    // =================================================================

    public function test_zero_resource_requirements()
    {
        $node = $this->createNode(['memory' => 1024, 'disk' => 10240]);
        
        // Use all memory with existing server
        $this->createServer(['node_id' => $node->id, 'memory' => 1024, 'disk' => 0]);

        // Should still work with 0 memory requirement
        $result = $this->service
            ->setMemory(0)
            ->setDisk(5120)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
    }

    public function test_helper_columns_are_hidden()
    {
        $node = $this->createNode(['memory' => 2048, 'disk' => 20480]);

        $result = $this->service
            ->setMemory(1024)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $nodeResult = $result->first();
        $this->assertTrue(in_array('free_memory', $nodeResult->getHidden()));
        $this->assertTrue(in_array('free_disk', $nodeResult->getHidden()));
        $this->assertArrayNotHasKey('free_memory', $nodeResult->toArray());
        $this->assertArrayNotHasKey('free_disk', $nodeResult->toArray());
    }

    public function test_complex_multi_node_scenario()
    {
        // High memory, low disk
        $memoryNode = $this->createNode([
            'memory' => 8192,
            'disk' => 20480,
            'memory_overallocate' => 25,
            'disk_overallocate' => 0,
        ]);

        // Balanced resources
        $balancedNode = $this->createNode([
            'memory' => 4096,
            'disk' => 102400,
            'memory_overallocate' => 50,
            'disk_overallocate' => 20,
        ]);

        // Low memory, high disk
        $diskNode = $this->createNode([
            'memory' => 2048,
            'disk' => 204800,
            'memory_overallocate' => 0,
            'disk_overallocate' => 10,
        ]);

        // Add existing usage
        $this->createServer(['node_id' => $memoryNode->id, 'memory' => 4096, 'disk' => 10240]);
        $this->createServer(['node_id' => $balancedNode->id, 'memory' => 2048, 'disk' => 51200]);
        $this->createServer(['node_id' => $diskNode->id, 'memory' => 1024, 'disk' => 102400]);

        // Memory-heavy allocation
        $result = $this->service
            ->setMemory(3072)
            ->setDisk(10240)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($memoryNode->id, $result->first()->id);

        // Disk-heavy allocation
        $result = $this->service
            ->setMemory(1024)
            ->setDisk(92160)
            ->setLocations([$this->location->id])
            ->handle();

        $this->assertCount(1, $result);
        $this->assertEquals($diskNode->id, $result->first()->id);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private function createNode(array $attributes = [], ?Location $location = null): Node
    {
        return Node::factory()->create(array_merge([
            'location_id' => ($location ?? $this->location)->id,
            'public' => true,
        ], $attributes));
    }

    private function createServer(array $attributes = []): Server
    {
        return $this->createServerModel($attributes);
    }
}
