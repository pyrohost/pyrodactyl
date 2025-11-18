<?php

namespace Pterodactyl\Console\Commands\User;

use Illuminate\Console\Command;
use Pterodactyl\Models\User;
use Pterodactyl\Models\AdminPermission;
use Pterodactyl\Services\Users\AdminPermissionService;

class ManageAdminPermissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'p:user:permissions 
                            {action : The action to perform (grant, revoke, list, sync)}
                            {--user= : The email or ID of the user}
                            {--permission= : The permission to grant or revoke}
                            {--all : Apply to all permissions}';

    /**
     * The console command description.
     */
    protected $description = 'Manage admin permissions for users';

    /**
     * Create a new command instance.
     */
    public function __construct(private AdminPermissionService $permissionService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'grant' => $this->grantPermission(),
            'revoke' => $this->revokePermission(),
            'list' => $this->listPermissions(),
            'sync' => $this->syncPermissions(),
            default => $this->invalidAction($action),
        };
    }

    /**
     * Grant permission(s) to a user.
     */
    private function grantPermission(): int
    {
        $user = $this->getUser();
        if (!$user) {
            return 1;
        }

        if ($this->option('all')) {
            $this->permissionService->grantAllPermissions($user);
            $this->info("Granted all admin permissions to {$user->email}");
            return 0;
        }

        $permission = $this->option('permission');
        if (!$permission) {
            $permission = $this->selectPermission();
            if (!$permission) {
                return 1;
            }
        }

        if (!in_array($permission, AdminPermission::allPermissions())) {
            $this->error("Invalid permission: {$permission}");
            return 1;
        }

        $this->permissionService->grantPermissions($user, [$permission]);
        $this->info("Granted permission '{$permission}' to {$user->email}");

        return 0;
    }

    /**
     * Revoke permission(s) from a user.
     */
    private function revokePermission(): int
    {
        $user = $this->getUser();
        if (!$user) {
            return 1;
        }

        if ($this->option('all')) {
            $this->permissionService->revokeAllPermissions($user);
            $this->info("Revoked all admin permissions from {$user->email}");
            return 0;
        }

        $permission = $this->option('permission');
        if (!$permission) {
            $permission = $this->selectPermissionFromUser($user);
            if (!$permission) {
                return 1;
            }
        }

        $this->permissionService->revokePermissions($user, [$permission]);
        $this->info("Revoked permission '{$permission}' from {$user->email}");

        return 0;
    }

    /**
     * List permissions for a user.
     */
    private function listPermissions(): int
    {
        if ($this->option('all')) {
            return $this->listAllPermissions();
        }

        $user = $this->getUser();
        if (!$user) {
            return 1;
        }

        $this->info("Permissions for {$user->email}:");
        $this->line('');

        if ($user->root_admin) {
            $this->warn('This user is a ROOT ADMIN and has all permissions.');
            $this->line('');
        }

        $permissions = $user->getAdminPermissions();
        
        if (empty($permissions)) {
            $this->warn('This user has no admin permissions.');
            return 0;
        }

        $grouped = AdminPermission::permissions();
        foreach ($grouped as $category) {
            $categoryPerms = array_intersect(array_keys($category['permissions']), $permissions);
            if (!empty($categoryPerms)) {
                $this->line("<comment>{$category['name']}:</comment>");
                foreach ($categoryPerms as $perm) {
                    $this->line("  ✓ {$category['permissions'][$perm]} ({$perm})");
                }
                $this->line('');
            }
        }

        $this->info("Total: " . count($permissions) . " permission(s)");

        return 0;
    }

    /**
     * List all available permissions.
     */
    private function listAllPermissions(): int
    {
        $this->info('All Available Admin Permissions:');
        $this->line('');

        $grouped = AdminPermission::permissions();
        foreach ($grouped as $category) {
            $this->line("<comment>{$category['name']}:</comment>");
            foreach ($category['permissions'] as $perm => $description) {
                $this->line("  • {$description}");
                $this->line("    <fg=gray>{$perm}</>");
            }
            $this->line('');
        }

        return 0;
    }

    /**
     * Sync permissions (replace all permissions with specified ones).
     */
    private function syncPermissions(): int
    {
        $user = $this->getUser();
        if (!$user) {
            return 1;
        }

        $this->warn('This will replace ALL current permissions for this user.');
        $this->info('Select permissions to grant (press enter when done):');
        
        $permissions = [];
        $available = AdminPermission::allPermissions();
        
        foreach (AdminPermission::permissions() as $category) {
            $this->line('');
            $this->line("<comment>{$category['name']}:</comment>");
            
            foreach ($category['permissions'] as $perm => $description) {
                if ($this->confirm("Grant: {$description}?", false)) {
                    $permissions[] = $perm;
                }
            }
        }

        if (empty($permissions) && !$this->confirm('Remove all permissions from this user?', false)) {
            $this->warn('Operation cancelled.');
            return 1;
        }

        $this->permissionService->updatePermissions($user, $permissions);
        $this->info("Updated permissions for {$user->email}");
        $this->info("Total permissions: " . count($permissions));

        return 0;
    }

    /**
     * Get user by email or ID.
     */
    private function getUser(): ?User
    {
        $identifier = $this->option('user');
        
        if (!$identifier) {
            $identifier = $this->ask('Enter user email or ID');
        }

        if (!$identifier) {
            $this->error('User email or ID is required.');
            return null;
        }

        $user = is_numeric($identifier)
            ? User::find($identifier)
            : User::where('email', $identifier)->first();

        if (!$user) {
            $this->error("User not found: {$identifier}");
            return null;
        }

        return $user;
    }

    /**
     * Let user select a permission from all available.
     */
    private function selectPermission(): ?string
    {
        $grouped = AdminPermission::permissions();
        $options = [];
        
        foreach ($grouped as $category) {
            foreach ($category['permissions'] as $perm => $description) {
                $options[] = $perm;
                $this->line(sprintf('[%d] %s - %s', count($options) - 1, $category['name'], $description));
            }
        }

        $choice = $this->ask('Select permission number');
        
        if (!is_numeric($choice) || !isset($options[$choice])) {
            $this->error('Invalid selection.');
            return null;
        }

        return $options[$choice];
    }

    /**
     * Let user select from permissions they currently have.
     */
    private function selectPermissionFromUser(User $user): ?string
    {
        $permissions = $user->adminPermissions()->pluck('permission')->toArray();
        
        if (empty($permissions)) {
            $this->warn('User has no permissions to revoke.');
            return null;
        }

        $this->info('Select permission to revoke:');
        foreach ($permissions as $index => $perm) {
            $this->line("[{$index}] {$perm}");
        }

        $choice = $this->ask('Select permission number');
        
        if (!is_numeric($choice) || !isset($permissions[$choice])) {
            $this->error('Invalid selection.');
            return null;
        }

        return $permissions[$choice];
    }

    /**
     * Handle invalid action.
     */
    private function invalidAction(string $action): int
    {
        $this->error("Invalid action: {$action}");
        $this->info('Valid actions are: grant, revoke, list, sync');
        return 1;
    }
}
