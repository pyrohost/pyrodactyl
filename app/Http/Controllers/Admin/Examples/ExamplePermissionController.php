<?php

namespace Pterodactyl\Http\Controllers\Admin\Examples;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Pterodactyl\Models\AdminPermission;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Traits\Controllers\ChecksAdminPermissions;

/**
 * Example controller demonstrating how to use the admin permissions system.
 * 
 * This controller shows various patterns for implementing permission checks
 * in your own controllers. You can copy these patterns to your actual controllers.
 * 
 * DO NOT USE THIS CONTROLLER IN PRODUCTION - IT'S FOR REFERENCE ONLY!
 */
class ExamplePermissionController extends Controller
{
    use ChecksAdminPermissions;

    /**
     * EXAMPLE 1: Using the trait helper method - Single permission
     * 
     * This is the recommended approach for most use cases.
     */
    public function example1_singlePermission(): View
    {
        // This will throw AccessDeniedHttpException if user doesn't have permission
        $this->requireAdminPermission(AdminPermission::USER_READ);
        
        // If we get here, user has permission
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    /**
     * EXAMPLE 2: Using the trait helper method - Any of multiple permissions
     * 
     * User needs at least ONE of the specified permissions.
     */
    public function example2_anyPermission(): View
    {
        // User needs either read OR update permission
        $this->requireAnyAdminPermission([
            AdminPermission::USER_READ,
            AdminPermission::USER_UPDATE,
        ]);
        
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    /**
     * EXAMPLE 3: Using the trait helper method - All permissions required
     * 
     * User must have ALL specified permissions.
     */
    public function example3_allPermissions(): View
    {
        // User needs both read AND update permission
        $this->requireAllAdminPermissions([
            AdminPermission::USER_READ,
            AdminPermission::USER_UPDATE,
        ]);
        
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    /**
     * EXAMPLE 4: Using the authorize convenience method
     * 
     * Quick method for standard CRUD operations.
     */
    public function example4_authorizeMethod(): View
    {
        // Automatically checks for 'admin.users.read' permission
        $this->authorize('users', 'read');
        
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    /**
     * EXAMPLE 5: Manual check with custom logic
     * 
     * Use when you need custom behavior based on permissions.
     */
    public function example5_manualCheck(): View
    {
        $user = auth()->user();
        
        // Manual check with custom response
        if (!$user->hasAdminPermission(AdminPermission::USER_READ)) {
            // You can return custom response instead of throwing exception
            return view('errors.no-permission')->with('message', 'You need user read permission');
        }
        
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    /**
     * EXAMPLE 6: Conditional logic based on permissions
     * 
     * Show different data or options based on what user can do.
     */
    public function example6_conditionalLogic(): View
    {
        $user = auth()->user();
        
        // Everyone with admin access can view this page
        $this->requireAnyAdminPermission([AdminPermission::USER_READ]);
        
        // But we'll customize what they see
        $users = User::all();
        $canCreate = $user->hasAdminPermission(AdminPermission::USER_CREATE);
        $canUpdate = $user->hasAdminPermission(AdminPermission::USER_UPDATE);
        $canDelete = $user->hasAdminPermission(AdminPermission::USER_DELETE);
        
        return view('admin.users.index', compact('users', 'canCreate', 'canUpdate', 'canDelete'));
    }

    /**
     * EXAMPLE 7: Different permissions for different actions
     * 
     * A complex method that does different things based on request.
     */
    public function example7_differentActions(Request $request): JsonResponse
    {
        $action = $request->input('action');
        
        switch ($action) {
            case 'list':
                $this->requireAdminPermission(AdminPermission::USER_READ);
                return response()->json(['users' => User::all()]);
                
            case 'create':
                $this->requireAdminPermission(AdminPermission::USER_CREATE);
                // Create logic here
                return response()->json(['message' => 'User created']);
                
            case 'delete':
                $this->requireAdminPermission(AdminPermission::USER_DELETE);
                // Delete logic here
                return response()->json(['message' => 'User deleted']);
                
            default:
                return response()->json(['error' => 'Invalid action'], 400);
        }
    }

    /**
     * EXAMPLE 8: Combining with Laravel's policy system
     * 
     * You can use both the permission system and Laravel policies together.
     */
    public function example8_withPolicy(User $user): View
    {
        // Check admin permission first
        $this->requireAdminPermission(AdminPermission::USER_UPDATE);
        
        // Then use Laravel's authorization (from Policy)
        $this->authorize('update', $user);
        
        return view('admin.users.edit', compact('user'));
    }

    /**
     * EXAMPLE 9: API endpoint with permission check
     * 
     * Useful for API controllers.
     */
    public function example9_apiEndpoint(): JsonResponse
    {
        $this->requireAdminPermission(AdminPermission::USER_READ);
        
        return response()->json([
            'data' => User::all(),
            'meta' => [
                'count' => User::count(),
            ],
        ]);
    }

    /**
     * EXAMPLE 10: Form submission with permission check
     * 
     * Pattern for handling form submissions.
     */
    public function example10_formSubmission(Request $request): RedirectResponse
    {
        $this->requireAdminPermission(AdminPermission::USER_CREATE);
        
        // Validate request
        $validated = $request->validate([
            'email' => 'required|email',
            'username' => 'required|string',
            // ... other fields
        ]);
        
        // Create user
        $user = User::create($validated);
        
        return redirect()
            ->route('admin.users.view', $user)
            ->with('success', 'User created successfully');
    }

    /**
     * EXAMPLE 11: Multiple permission checks in sequence
     * 
     * When you need to check different permissions at different points.
     */
    public function example11_sequentialChecks(User $user): View
    {
        // First check if they can view users at all
        $this->requireAdminPermission(AdminPermission::USER_READ);
        
        // Load basic user data
        $userData = $user->toArray();
        
        // Check if they can see sensitive data
        if (auth()->user()->hasAdminPermission(AdminPermission::USER_UPDATE)) {
            // Include more sensitive information
            $userData['last_login_ip'] = $user->last_login_ip;
            $userData['sessions'] = $user->sessions;
        }
        
        return view('admin.users.view', ['user' => $userData]);
    }

    /**
     * EXAMPLE 12: Graceful degradation
     * 
     * Return different responses based on permissions without throwing errors.
     */
    public function example12_gracefulDegradation(): View
    {
        $user = auth()->user();
        $data = [];
        
        // Try to get user data if they have permission
        if ($user->hasAdminPermission(AdminPermission::USER_READ)) {
            $data['users'] = User::all();
        }
        
        // Try to get server data if they have permission
        if ($user->hasAdminPermission(AdminPermission::SERVER_READ)) {
            $data['servers'] = \Pterodactyl\Models\Server::all();
        }
        
        // Try to get node data if they have permission
        if ($user->hasAdminPermission(AdminPermission::NODE_READ)) {
            $data['nodes'] = \Pterodactyl\Models\Node::all();
        }
        
        return view('admin.dashboard', $data);
    }
}

/**
 * EXAMPLE 13: Route-level middleware (add to routes/admin.php)
 * 
 * Apply permission checks at the route level instead of in controller:
 * 
 * use Pterodactyl\Http\Middleware\RequireAdminPermission;
 * use Pterodactyl\Models\AdminPermission;
 * 
 * Route::get('/admin/users', [UserController::class, 'index'])
 *     ->middleware(RequireAdminPermission::class . ':' . AdminPermission::USER_READ);
 * 
 * // Or with multiple permissions (user needs any one):
 * Route::get('/admin/users', [UserController::class, 'index'])
 *     ->middleware(RequireAdminPermission::class . ':admin.users.read,admin.users.update');
 * 
 * // Or for a group:
 * Route::middleware([RequireAdminPermission::class . ':' . AdminPermission::USER_READ])
 *     ->group(function () {
 *         Route::get('/admin/users', [UserController::class, 'index']);
 *         Route::get('/admin/users/{user}', [UserController::class, 'show']);
 *     });
 */

/**
 * EXAMPLE 14: Blade template usage (add to your views)
 * 
 * {{-- Check single permission --}}
 * @if(auth()->user()->hasAdminPermission(\Pterodactyl\Models\AdminPermission::USER_CREATE))
 *     <button>Create User</button>
 * @endif
 * 
 * {{-- Check if root admin OR has permission --}}
 * @if(auth()->user()->root_admin || auth()->user()->hasAdminPermission(\Pterodactyl\Models\AdminPermission::USER_DELETE))
 *     <button class="btn-danger">Delete</button>
 * @endif
 * 
 * {{-- Check if any kind of admin --}}
 * @if(auth()->user()->isAdmin())
 *     <a href="{{ route('admin.index') }}">Admin Panel</a>
 * @endif
 * 
 * {{-- Conditional menu items --}}
 * @if(auth()->user()->hasAdminPermission(\Pterodactyl\Models\AdminPermission::USER_READ))
 *     <li><a href="{{ route('admin.users') }}">Users</a></li>
 * @endif
 * 
 * @if(auth()->user()->hasAdminPermission(\Pterodactyl\Models\AdminPermission::SERVER_READ))
 *     <li><a href="{{ route('admin.servers') }}">Servers</a></li>
 * @endif
 */

/**
 * BEST PRACTICES:
 * 
 * 1. Use permission constants (AdminPermission::USER_READ) instead of strings
 * 2. Check permissions as early as possible in your method
 * 3. Use the trait helpers for consistency
 * 4. Apply permissions at route level when the entire route needs protection
 * 5. Use conditional logic when you want to customize based on permissions
 * 6. Always test with users that DON'T have permissions
 * 7. Root admins automatically pass all checks - this is by design
 * 8. Consider UX - don't show buttons/links for actions users can't perform
 * 9. Log permission denials if needed for security auditing
 * 10. Document which permissions your new features require
 */
