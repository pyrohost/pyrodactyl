<?php

namespace Pterodactyl\Services\Users;

use Pterodactyl\Models\User;
use Pterodactyl\Models\AdminPermission;
use Illuminate\Database\ConnectionInterface;

class AdminPermissionService
{
    /**
     * AdminPermissionService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
    ) {
    }

    /**
     * Update admin permissions for a user.
     * This will sync the permissions to match the provided array.
     *
     * @param User $user
     * @param array $permissions Array of permission keys
     * @throws \Throwable
     */
    public function updatePermissions(User $user, array $permissions): void
    {
        // Validate all permissions exist
        $validPermissions = AdminPermission::allPermissions();
        $permissions = array_filter($permissions, function ($permission) use ($validPermissions) {
            return in_array($permission, $validPermissions);
        });

        $this->connection->transaction(function () use ($user, $permissions) {
            // Delete all existing permissions
            $user->adminPermissions()->delete();

            // If user is root admin, don't add any specific permissions
            // as they have access to everything
            if ($user->root_admin) {
                return;
            }

            // Add new permissions
            foreach ($permissions as $permission) {
                $user->adminPermissions()->create([
                    'permission' => $permission,
                ]);
            }
        });
    }

    /**
     * Grant specific permissions to a user.
     *
     * @param User $user
     * @param array $permissions Array of permission keys to grant
     * @throws \Throwable
     */
    public function grantPermissions(User $user, array $permissions): void
    {
        // Validate all permissions exist
        $validPermissions = AdminPermission::allPermissions();
        $permissions = array_filter($permissions, function ($permission) use ($validPermissions) {
            return in_array($permission, $validPermissions);
        });

        // If user is root admin, they already have all permissions
        if ($user->root_admin) {
            return;
        }

        $this->connection->transaction(function () use ($user, $permissions) {
            foreach ($permissions as $permission) {
                // Check if permission already exists
                if (!$user->adminPermissions()->where('permission', $permission)->exists()) {
                    $user->adminPermissions()->create([
                        'permission' => $permission,
                    ]);
                }
            }
        });
    }

    /**
     * Revoke specific permissions from a user.
     *
     * @param User $user
     * @param array $permissions Array of permission keys to revoke
     * @throws \Throwable
     */
    public function revokePermissions(User $user, array $permissions): void
    {
        // Root admins can't have individual permissions revoked
        if ($user->root_admin) {
            return;
        }

        $this->connection->transaction(function () use ($user, $permissions) {
            $user->adminPermissions()->whereIn('permission', $permissions)->delete();
        });
    }

    /**
     * Grant all permissions to a user.
     *
     * @param User $user
     * @throws \Throwable
     */
    public function grantAllPermissions(User $user): void
    {
        $this->grantPermissions($user, AdminPermission::allPermissions());
    }

    /**
     * Revoke all permissions from a user.
     *
     * @param User $user
     * @throws \Throwable
     */
    public function revokeAllPermissions(User $user): void
    {
        $this->connection->transaction(function () use ($user) {
            $user->adminPermissions()->delete();
        });
    }

    /**
     * Copy permissions from one user to another.
     *
     * @param User $fromUser
     * @param User $toUser
     * @throws \Throwable
     */
    public function copyPermissions(User $fromUser, User $toUser): void
    {
        if ($fromUser->root_admin) {
            $permissions = AdminPermission::allPermissions();
        } else {
            $permissions = $fromUser->adminPermissions()->pluck('permission')->toArray();
        }

        $this->updatePermissions($toUser, $permissions);
    }
}
