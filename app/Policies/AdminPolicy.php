<?php

namespace Pterodactyl\Policies;

use Pterodactyl\Models\User;
use Pterodactyl\Models\AdminPermission;
use Illuminate\Auth\Access\HandlesAuthorization;

class AdminPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the user can view users.
     */
    public function viewUsers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::USER_READ);
    }

    /**
     * Determine if the user can create users.
     */
    public function createUsers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::USER_CREATE);
    }

    /**
     * Determine if the user can update users.
     */
    public function updateUsers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::USER_UPDATE);
    }

    /**
     * Determine if the user can delete users.
     */
    public function deleteUsers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::USER_DELETE);
    }

    /**
     * Determine if the user can view servers.
     */
    public function viewServers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SERVER_READ);
    }

    /**
     * Determine if the user can create servers.
     */
    public function createServers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SERVER_CREATE);
    }

    /**
     * Determine if the user can update servers.
     */
    public function updateServers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SERVER_UPDATE);
    }

    /**
     * Determine if the user can delete servers.
     */
    public function deleteServers(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SERVER_DELETE);
    }

    /**
     * Determine if the user can view nodes.
     */
    public function viewNodes(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::NODE_READ);
    }

    /**
     * Determine if the user can create nodes.
     */
    public function createNodes(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::NODE_CREATE);
    }

    /**
     * Determine if the user can update nodes.
     */
    public function updateNodes(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::NODE_UPDATE);
    }

    /**
     * Determine if the user can delete nodes.
     */
    public function deleteNodes(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::NODE_DELETE);
    }

    /**
     * Determine if the user can view settings.
     */
    public function viewSettings(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SETTINGS_READ);
    }

    /**
     * Determine if the user can update settings.
     */
    public function updateSettings(User $user): bool
    {
        return $user->root_admin || $user->hasAdminPermission(AdminPermission::SETTINGS_UPDATE);
    }

    /**
     * General method to check any admin permission.
     */
    public function hasPermission(User $user, string $permission): bool
    {
        return $user->root_admin || $user->hasAdminPermission($permission);
    }
}
