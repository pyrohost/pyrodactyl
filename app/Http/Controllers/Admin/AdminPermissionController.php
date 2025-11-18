<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Models\AdminPermission;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Services\Users\AdminPermissionService;
use Pterodactyl\Http\Requests\Admin\AdminPermissionFormRequest;

class AdminPermissionController extends Controller
{
    /**
     * AdminPermissionController constructor.
     */
    public function __construct(
        protected AlertsMessageBag $alert,
        protected AdminPermissionService $permissionService,
        protected Translator $translator,
        protected ViewFactory $view,
    ) {
    }

    /**
     * Display the permissions view for a user.
     */
    public function view(User $user): View
    {
        $permissions = AdminPermission::permissions();
        $userPermissions = $user->getAdminPermissions();

        return $this->view->make('admin.users.permissions', [
            'user' => $user,
            'permissions' => $permissions,
            'userPermissions' => $userPermissions,
        ]);
    }

    /**
     * Update permissions for a user.
     *
     * @throws \Throwable
     */
    public function update(AdminPermissionFormRequest $request, User $user): RedirectResponse
    {
        $permissions = $request->input('permissions', []);
        
        $this->permissionService->updatePermissions($user, $permissions);

        $this->alert->success($this->translator->get('admin/user.notices.permissions_updated'))->flash();

        return redirect()->route('admin.users.permissions', $user->id);
    }

    /**
     * Get permissions as JSON (for API or AJAX requests).
     */
    public function json(User $user): JsonResponse
    {
        return response()->json([
            'permissions' => $user->getAdminPermissions(),
            'is_root_admin' => $user->root_admin,
        ]);
    }

    /**
     * Get all available permissions as JSON.
     */
    public function available(): JsonResponse
    {
        return response()->json([
            'permissions' => AdminPermission::permissions(),
        ]);
    }
}
