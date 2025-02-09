<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Plans;

use Illuminate\Http\Request;
use Pterodactyl\Models\Plan;
use Illuminate\Http\JsonResponse;


use Pterodactyl\Http\Controllers\Controller;

class PlanController extends Controller
{
    /**
     * Retrieve all plans and send as JSON.
     *
     * @param Request $request
     * @return JsonResponse
     */
    

    public function indexJson(): JsonResponse
    {
        $plans = Plan::query()
            ->select(['id', 'name', 'memory', 'cpu', 'disk', 'price', 'backups', 'databases', 'allocations'])
            ->orderBy('memory')
            ->get();

        return response()->json([
            'data' => $plans,
            'meta' => [
                'total' => $plans->count()
            ]
        ]);
    }

    /**
     * Create a new plan.
     *
     * Expects a POST request with payload:
     * {
     *    "name": "Example Plan",
     *    "description": "...",
     *    "price": 19.99,
     *    "transferrableTo": [...],
     *    "image": "...",
     *    "billingCycles": [...],
     *    "renewable": true,
     *    "platform": "...",
     *    "productContent": {...},
     *    "invisible": false,
     *    "amountAllowedPerCustomer": 1,
     *    "purchases": 0,
     *    "recurrentResources": false,
     *    "limits": {...},
     *    "strikeThroughPrice": 29.99,
     *    "redir": "...",
     *    "upperdesc": "..."
     * }
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
{
    $data = $request->validate([
        'name' => 'required|string|max:191',
        'description' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'cpu' => 'required|numeric|min:0',
        'memory' => 'required|integer|min:1',
        'disk' => 'required|integer|min:1',
        'servers' => 'required|integer|min:1',
        'allocations' => 'required|integer|min:0',
        'backups' => 'required|integer|min:0',
        'databases' => 'required|integer|min:0',
        'renewable' => 'required|boolean',
        'invisible' => 'required|boolean',
        'isTrial' => 'required|boolean',
        'image' => 'nullable|string|url',
        'strikeThroughPrice' => 'nullable|numeric',
        'redir' => 'nullable|string|url',
        'upperdesc' => 'nullable|string',
    ]);

    $plan = Plan::create([
        'name' => $data['name'],
        'description' => $data['description'] ?? null,
        'price' => (float) $data['price'],
        'cpu' => (float) $data['cpu'],
        'memory' => (int) $data['memory'],
        'disk' => (int) $data['disk'],
        'servers' => (int) $data['servers'],
        'allocations' => (int) $data['allocations'],
        'backups' => (int) $data['backups'],
        'databases' => (int) $data['databases'],
        'renewable' => (bool) $data['renewable'],
        'invisible' => (bool) $data['invisible'],
        'isTrial' => (bool) $data['isTrial'],
        'image' => $data['image'] ?? null,
        'strike_through_price' => $data['strikeThroughPrice'] ?? null,
        'redir' => $data['redir'] ?? null,
        'upper_desc' => $data['upperdesc'] ?? null,
    ]);

    return response()->json([
        'data' => $plan,
        'message' => 'Plan created successfully'
    ], 201);
}
    public function update(Request $request, Plan $plan): JsonResponse
{
    $data = $request->validate([
        'name' => 'sometimes|string',
        'description' => 'nullable|string',
        'price' => 'sometimes|numeric',
        'transferrableTo' => 'nullable|array',
        'image' => 'nullable|string',
        'billingCycles' => 'nullable|array',
        'renewable' => 'nullable|boolean',
        'platform' => 'nullable|string',
        'productContent' => 'nullable|array',
        'invisible' => 'nullable|boolean',
        'amountAllowedPerCustomer' => 'nullable|integer',
        'purchases' => 'nullable|integer',
        'recurrentResources' => 'nullable|boolean',
        'limits' => 'nullable|array',
        'strikeThroughPrice' => 'nullable|numeric',
        'redir' => 'nullable|string',
        'upperdesc' => 'nullable|string',
    ]);

    $plan->update($data);

    return response()->json([
        'message' => 'Plan updated successfully.',
        'plan' => $plan->fresh(),
    ]);
}
}