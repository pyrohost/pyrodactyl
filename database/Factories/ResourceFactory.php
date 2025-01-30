<?php

namespace Database\Factories;

use App\Models\Resource;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResourceFactory extends Factory
{
    protected $model = Resource::class;

    public function definition(): array
    {
        return [
            'cpu' => env('IN_CPU', 0.5),
            'memory' => env('IN_RAM', 512),
            'disk' => env('IN_DISK', 512),
            'allocations' => env('IN_ALLOCATIONS', 1),
            'servers' => env('IN_SERVERS', 1)
        ];
    }
}