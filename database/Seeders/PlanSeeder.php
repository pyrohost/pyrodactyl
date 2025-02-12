<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Pterodactyl\Models\Plan;
use Carbon\Carbon;

class PlanSeeder extends Seeder
{
    public function run()
    {
        Plan::create([
            'name' => 'Free Tier',
            'description' => 'Basic free hosting plan for all users',
            'price' => 0,
            'cpu' => (float) env('IN_CPU', 75),
            'memory' => (int) env('IN_RAM', 1500),
            'disk' => (int) env('IN_DISK', 2500),
            'servers' => (int) env('IN_SERVERS', 1),
            'allocations' => (int) env('IN_ALLOCATIONS', 1),
            'backups' => (int) env('IN_BACKUPS', 0),
            'databases' => (int) env('IN_DATABASES', 0),
            'renewable' => false,
            'invisible' => false,
            'isTrial' => true,
            'expiresIn' => Carbon::now()->addDays(10)
        ]);
    }
}