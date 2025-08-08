<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $this->call(NestSeeder::class);
        $this->call(EggSeeder::class);
        
        // Run development seeder in local environment
        if (app()->environment('local')) {
            $this->call(DevelopmentSeeder::class);
        }
    }
}
