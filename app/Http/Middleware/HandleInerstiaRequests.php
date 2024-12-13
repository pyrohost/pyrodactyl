<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Define the props that are shared by default.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'uuid' => $user->uuid,
                    'username' => $user->username,
                    'email' => $user->email,
                    'rootAdmin' => $user->root_admin,
                    'useTotp' => $user->use_totp,
                    'language' => $user->language,
                    'createdAt' => $user->created_at,
                    'updatedAt' => $user->updated_at,
                ] : null,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'shop' => [
                'prices' => config('shop.prices'),
                'userCoins' => $user ? $user->coins : 0,
                'maxPurchaseAmounts' => [
                    'cpu' => config('shop.max_cpu', 69),
                    'memory' => config('shop.max_memory', 4096),
                    'disk' => config('shop.max_disk', 10240),
                    'databases' => config('shop.max_databases', 5),
                    'allocations' => config('shop.max_allocations', 5),
                    'backups' => config('shop.max_backups', 5),
                ],
            ],
            'linkvertiseEnabled' => config('linkvertise.enabled'),
            'linkvertiseId'      => config('linkvertise.id'),
            'pterodactyl_URL'    => env('PTERODACTYL_API_URL'),
        ]);
    }
}