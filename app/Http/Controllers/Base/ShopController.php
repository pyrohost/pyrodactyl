<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\ShopResources;
use Pterodactyl\Services\Notifications\NotificationService;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;


class ShopController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(): JsonResponse
    {
        try {
            $resources = ShopResources::all();
            return response()->json([
                'success' => true,
                'data' => $resources
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */     
     
    public function update(Request $request, string $id)     
    {         
        //     
    }


    public function buy(Request $request, string $id): RedirectResponse 
{
    try {
        return DB::transaction(function () use ($request, $id) {
            // Find resource
            $resource = ShopResources::findOrFail($id);
            $user = $request->user();
            
            // Check if resource is hidden 
            if ($resource->is_hidden) {
                return redirect()->back()->with('error', 'This resource is not available for purchase, No records of it has been found.');
                app(NotificationService::class)->notify(
                    'admins', // target: 'all', 'admins', userId, or array of userIds
                    'A user has tried to Purchase a hidden item.', // title
                    "User attempted to purchase hidden resource \n Resource Type: {$resource->type} user email : {$user->email} ", // description
                    null, // optional image URL
                    'warning' // notification type
                );
                // make something to where it warns the administrors reguarding this issue, if they are found on the panel  
            }

            // Calculate final price
            $price = $resource->is_discounted ? 
                $resource->discounted_price : 
                $resource->price;

            // Check if user has enough coins
            if ($user->coins < $price) {
                app(NotificationService::class)->notify(
                    'admin', // target: 'all', 'admins', userId, or array of userIds
                    'Failure in Purchasing an item', // title
                    " So sorry, you don't have enough coins,to purchase {$resource->type}. You currently have {$user->coins}", // description
                    null, // optional image URL
                    'warning' // notification type
                );
                return back()->with('error', [
                    'title' => 'Insufficient Coins',
                    'desc' => 'Insufficient coins, please top up your account with the needed balance to purchase this resource.'
                ]);
            }

              // Update user limits
$limits = $user->limits ?? [];
$resourceType = strtolower($resource->type);

// Map resource types to limits keys
switch ($resourceType) {
    case 'cpu':
        $limits['cpu'] = ($limits['cpu'] ?? 0) + $resource->value;
        break;
    case 'ram':
        $limits['memory'] = ($limits['memory'] ?? 0) + $resource->value;
        break;
    case 'disk':
        $limits['disk'] = ($limits['disk'] ?? 0) + $resource->value;
        break;
    case 'server':
    case 'servers':
        $limits['servers'] = ($limits['servers'] ?? 0) + $resource->value;
        break;
    case 'allocation':
    case 'allocations':
        $limits['allocations'] = ($limits['allocations'] ?? 0) + $resource->value;
        break;
    case 'backup':
    case 'backups':
        $limits['backups'] = ($limits['backups'] ?? 0) + $resource->value;
        break;
    case 'database':
    case 'databases':
        $limits['databases'] = ($limits['databases'] ?? 0) + $resource->value;
        break;
    default:
        throw new \Exception('Invalid resource type');
}

$user->coins -= $price;
$user->limits = $limits;
$user->save();
            // Log transaction
            //implement later


            app(NotificationService::class)->notify(
                $user->id, // target: 'all', 'admins', userId, or array of userIds
                'Purchased an item', // title
                "User sucessfully purchased \n Resource Type: {$resource->type} \n user email : {$user->email} ", // description
                null, // optional image URL
                'success' // notification type
            );

            
            return back()->with('success', [
                'title' => 'Successfully Purchased',
                'desc' => "Successfully purchased {$resource->value} {$resource->type} for your account."
            ]);
        });
    } catch (\Exception $e) {
        return back()->with('error', [
            'title' => 'Internal Server Error 500',
            'desc' => "DEBUG {$resource->value} \n DEBUG {$resource->type} for your account."
        ]);
    }
}

    



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
