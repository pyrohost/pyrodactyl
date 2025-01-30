<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Pterodactyl\Models\ShopResources;

class ShopResourcesSeeder extends Seeder
{
    public function run(): void
    {
        ShopResources::truncate();

        $resources = [
            [
                'name' => 'CPU',
                'value' => 100,
                'price' => 1000
            ],
            [
                'name' => 'RAM',
                'value' => 512,
                'price' => 500
            ],
            [
                'name' => 'DISK',
                'value' => 1024,
                'price' => 350
            ],
            [
                'name' => 'ALLOCATION',
                'value' => 1,
                'price' => 75
            ],
            [
                'name' => 'SERVER',
                'value' => 1,
                'price' => 300
            ],
            [
                'name' => 'BACKUP',
                'value' => 1,
                'price' => 300
            ],
            

        ];

        foreach ($resources as $resource) {
            ShopResources::create([
                'type' => $resource['name'],
                'value' => $resource['value'],
                'price' => $resource['price'],
                'discounted_price' => null,
                'is_discounted' => false,
                'amount' => 1,
                'limit' => -1,
                'is_hidden' => false,
            ]);
        }
    }
}