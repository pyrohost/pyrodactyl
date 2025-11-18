<?php

namespace Pterodactyl\Traits\Controllers;

use Pterodactyl\Models\User;
use Pterodactyl\Models\AdminPermission;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

trait ChecksAdminPermissions
{
    /**
     * Check if the current user has a specific admin permission.
     *
     * @throws AccessDeniedHttpException
     */
    protected function requireAdminPermission(string $permission): void
    {
        $user = request()->user();

        if (!$user || (!$user->root_admin && !$user->hasAdminPermission($permission))) {
            throw new AccessDeniedHttpException(
                'You do not have permission to perform this action.'
            );
        }
    }

    /**
     * Check if the current user has any of the specified admin permissions.
     *
     * @throws AccessDeniedHttpException
     */
    protected function requireAnyAdminPermission(array $permissions): void
    {
        $user = request()->user();

        if (!$user || (!$user->root_admin && !$user->hasAnyAdminPermission($permissions))) {
            throw new AccessDeniedHttpException(
                'You do not have permission to perform this action.'
            );
        }
    }

    /**
     * Check if the current user has all of the specified admin permissions.
     *
     * @throws AccessDeniedHttpException
     */
    protected function requireAllAdminPermissions(array $permissions): void
    {
        $user = request()->user();

        if (!$user || (!$user->root_admin && !$user->hasAllAdminPermissions($permissions))) {
            throw new AccessDeniedHttpException(
                'You do not have all required permissions to perform this action.'
            );
        }
    }

    /**
     * Check if the current user can perform an action (read, create, update, delete).
     * This is a convenience method for common CRUD operations.
     *
     * @param string $resource The resource type (users, servers, nodes, etc.)
     * @param string $action The action (read, create, update, delete)
     * @throws AccessDeniedHttpException
     */
    protected function authorize(string $resource, string $action): void
    {
        $permission = "admin.{$resource}.{$action}";
        $this->requireAdminPermission($permission);
    }
}
