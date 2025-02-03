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
    public function index(Request $request): Response
    {
        $plans = Plan::all();

        

        return redirect()->back()->with(['plans' => $plans]);
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
            'name'                      => 'required|string',
            'description'               => 'nullable|string',
            'price'                     => 'required|numeric',
            'transferrableTo'           => 'nullable|array',
            'image'                     => 'nullable|string',
            'billingCycles'             => 'nullable|array',
            'renewable'                 => 'nullable|boolean',
            'platform'                  => 'nullable|string',
            'productContent'            => 'nullable|array',
            'invisible'                 => 'nullable|boolean',
            'amountAllowedPerCustomer'  => 'nullable|integer',
            'purchases'                 => 'nullable|integer',
            'recurrentResources'        => 'nullable|boolean',
            'limits'                    => 'nullable|array',
            'strikeThroughPrice'        => 'nullable|numeric',
            'redir'                     => 'nullable|string',
            'upperdesc'                 => 'nullable|string',
        ]);

        $plan = Plan::create($data);

        return response()->json([
            'message' => 'Plan created successfully.',
            'plan'    => $plan,
        ], 201);
    }
}