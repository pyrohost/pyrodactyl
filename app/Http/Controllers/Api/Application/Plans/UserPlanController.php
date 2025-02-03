<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Plans;

use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Plan;
use Inertia\Response;
use Inertia\Inertia;
use Pterodactyl\Http\Controllers\Controller;

class UserPlanController extends Controller
{
    /**
     * Admin: Add a plan to a user.
     *
     * @param Request $request
     * @param string $userId
     */
    public function store(Request $request, string $userId)
    {
        $data = $request->validate([
            'plan_id' => 'required|string|exists:plans,id',
            'count'   => 'required|integer|min:1',
        ]);

        $user = User::findOrFail((int) $userId);
        $plan = Plan::findOrFail((int) $data['plan_id']);
        
        $purchasedPlans = $user->purchases_plans ?? [];
        
        for ($i = 0; $i < $data['count']; $i++) {
            $purchasedPlans[] = [
                'plan_id'    => $plan->id,
                'identifier' => $plan->identifier ?? $plan->id,
                'name'       => $plan->name,
                'added_at'   => now()->toDateTimeString(),
            ];
        }

        $user->purchases_plans = $purchasedPlans;
        $user->save();

        return back()->with('success', 'Plan(s) added successfully');
    }

    /**
 * Remove a plan from user.
 *
 * @param Request $request
 * @param int $userId
 */
public function destroy(Request $request, int $userId)
{
    $data = $request->validate([
        'plan_id' => 'required|string|exists:plans,id'
    ]);

    $user = User::findOrFail($userId);
    $purchasedPlans = $user->purchases_plans ?? [];
    
    // Count matching plans
    $matchingPlans = array_filter($purchasedPlans, function($plan) use ($data) {
        return $plan['plan_id'] == (int) $data['plan_id'];
    });
    
    if (count($matchingPlans) > 1) {
        // Remove only one instance
        $removed = false;
        $purchasedPlans = array_values(array_filter($purchasedPlans, function($plan) use ($data, &$removed) {
            if (!$removed && $plan['plan_id'] == (int) $data['plan_id']) {
                $removed = true;
                return false;
            }
            return true;
        }));
    } else {
        // Remove all instances
        $purchasedPlans = array_values(array_filter($purchasedPlans, function($plan) use ($data) {
            return $plan['plan_id'] != (int) $data['plan_id'];
        }));
    }

    $user->purchases_plans = $purchasedPlans;
    $user->save();

    return back()->with('success', 'Plan removed successfully');
}
}