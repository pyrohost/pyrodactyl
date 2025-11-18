<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Pterodactyl\Models\User;
use Pterodactyl\Models\AdminPermission;
use Illuminate\Support\Facades\Hash;

class AdminPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Example usage:
     * php artisan db:seed --class=AdminPermissionSeeder
     */
    public function run(): void
    {
        $this->command->info('Admin Permission System Seeder');
        $this->command->info('=============================');
        $this->command->newLine();

        // Check if we should create example users
        if ($this->command->confirm('Create example admin users with different permission sets?', true)) {
            $this->createExampleUsers();
        }

        // Check if we should add permissions to existing users
        if ($this->command->confirm('Add permissions to existing users?', false)) {
            $this->addPermissionsToExistingUsers();
        }

        $this->command->newLine();
        $this->command->info('Seeding completed!');
    }

    /**
     * Create example admin users with different permission sets.
     */
    private function createExampleUsers(): void
    {
        $this->command->info('Creating example admin users...');

        // Create a user manager admin (can only manage users)
        $userManager = User::firstOrCreate(
            ['email' => 'usermanager@example.com'],
            [
                'username' => 'usermanager',
                'name_first' => 'User',
                'name_last' => 'Manager',
                'password' => Hash::make('password'),
                'root_admin' => false,
            ]
        );

        if ($userManager->wasRecentlyCreated) {
            $userManager->adminPermissions()->createMany([
                ['permission' => AdminPermission::USER_READ],
                ['permission' => AdminPermission::USER_CREATE],
                ['permission' => AdminPermission::USER_UPDATE],
                ['permission' => AdminPermission::USER_DELETE],
            ]);
            $this->command->info('✓ Created User Manager (usermanager@example.com / password)');
        }

        // Create a server manager admin (can only manage servers)
        $serverManager = User::firstOrCreate(
            ['email' => 'servermanager@example.com'],
            [
                'username' => 'servermanager',
                'name_first' => 'Server',
                'name_last' => 'Manager',
                'password' => Hash::make('password'),
                'root_admin' => false,
            ]
        );

        if ($serverManager->wasRecentlyCreated) {
            $serverManager->adminPermissions()->createMany([
                ['permission' => AdminPermission::SERVER_READ],
                ['permission' => AdminPermission::SERVER_CREATE],
                ['permission' => AdminPermission::SERVER_UPDATE],
                ['permission' => AdminPermission::SERVER_DELETE],
                ['permission' => AdminPermission::SERVER_VIEW_CONSOLE],
            ]);
            $this->command->info('✓ Created Server Manager (servermanager@example.com / password)');
        }

        // Create a read-only admin (can view everything but not modify)
        $readOnly = User::firstOrCreate(
            ['email' => 'readonly@example.com'],
            [
                'username' => 'readonly',
                'name_first' => 'Read',
                'name_last' => 'Only',
                'password' => Hash::make('password'),
                'root_admin' => false,
            ]
        );

        if ($readOnly->wasRecentlyCreated) {
            $readOnly->adminPermissions()->createMany([
                ['permission' => AdminPermission::USER_READ],
                ['permission' => AdminPermission::SERVER_READ],
                ['permission' => AdminPermission::NODE_READ],
                ['permission' => AdminPermission::LOCATION_READ],
                ['permission' => AdminPermission::DATABASE_READ],
                ['permission' => AdminPermission::NEST_READ],
                ['permission' => AdminPermission::MOUNT_READ],
                ['permission' => AdminPermission::SETTINGS_READ],
                ['permission' => AdminPermission::API_KEYS_READ],
            ]);
            $this->command->info('✓ Created Read-Only Admin (readonly@example.com / password)');
        }

        // Create a full admin with all permissions (but not root)
        $fullAdmin = User::firstOrCreate(
            ['email' => 'fulladmin@example.com'],
            [
                'username' => 'fulladmin',
                'name_first' => 'Full',
                'name_last' => 'Admin',
                'password' => Hash::make('password'),
                'root_admin' => false,
            ]
        );

        if ($fullAdmin->wasRecentlyCreated) {
            $permissions = AdminPermission::allPermissions();
            $permissionData = array_map(function ($permission) {
                return ['permission' => $permission];
            }, $permissions);
            $fullAdmin->adminPermissions()->createMany($permissionData);
            $this->command->info('✓ Created Full Admin (fulladmin@example.com / password)');
        }
    }

    /**
     * Add permissions to existing users interactively.
     */
    private function addPermissionsToExistingUsers(): void
    {
        $users = User::where('root_admin', false)->get();

        if ($users->isEmpty()) {
            $this->command->warn('No non-root admin users found.');
            return;
        }

        $this->command->info('Select a user to add permissions to:');
        
        foreach ($users as $index => $user) {
            $permCount = $user->adminPermissions()->count();
            $this->command->line(sprintf(
                '[%d] %s (%s) - %d permission(s)',
                $index,
                $user->username,
                $user->email,
                $permCount
            ));
        }

        $userIndex = $this->command->ask('Enter user number');
        
        if (!isset($users[$userIndex])) {
            $this->command->error('Invalid user selection.');
            return;
        }

        $selectedUser = $users[$userIndex];
        
        $this->command->info('Select permission category:');
        $this->command->line('[0] All Permissions');
        $this->command->line('[1] User Management');
        $this->command->line('[2] Server Management');
        $this->command->line('[3] Node Management');
        $this->command->line('[4] Location Management');
        $this->command->line('[5] Database Management');
        $this->command->line('[6] Nest & Egg Management');
        $this->command->line('[7] Mount Management');
        $this->command->line('[8] Settings Management');
        $this->command->line('[9] API Key Management');

        $category = $this->command->ask('Enter category number');

        $permissions = match ((int) $category) {
            0 => AdminPermission::allPermissions(),
            1 => [
                AdminPermission::USER_READ,
                AdminPermission::USER_CREATE,
                AdminPermission::USER_UPDATE,
                AdminPermission::USER_DELETE,
            ],
            2 => [
                AdminPermission::SERVER_READ,
                AdminPermission::SERVER_CREATE,
                AdminPermission::SERVER_UPDATE,
                AdminPermission::SERVER_DELETE,
                AdminPermission::SERVER_VIEW_CONSOLE,
            ],
            3 => [
                AdminPermission::NODE_READ,
                AdminPermission::NODE_CREATE,
                AdminPermission::NODE_UPDATE,
                AdminPermission::NODE_DELETE,
            ],
            4 => [
                AdminPermission::LOCATION_READ,
                AdminPermission::LOCATION_CREATE,
                AdminPermission::LOCATION_UPDATE,
                AdminPermission::LOCATION_DELETE,
            ],
            5 => [
                AdminPermission::DATABASE_READ,
                AdminPermission::DATABASE_CREATE,
                AdminPermission::DATABASE_UPDATE,
                AdminPermission::DATABASE_DELETE,
            ],
            6 => [
                AdminPermission::NEST_READ,
                AdminPermission::NEST_CREATE,
                AdminPermission::NEST_UPDATE,
                AdminPermission::NEST_DELETE,
            ],
            7 => [
                AdminPermission::MOUNT_READ,
                AdminPermission::MOUNT_CREATE,
                AdminPermission::MOUNT_UPDATE,
                AdminPermission::MOUNT_DELETE,
            ],
            8 => [
                AdminPermission::SETTINGS_READ,
                AdminPermission::SETTINGS_UPDATE,
            ],
            9 => [
                AdminPermission::API_KEYS_READ,
                AdminPermission::API_KEYS_CREATE,
                AdminPermission::API_KEYS_DELETE,
            ],
            default => [],
        };

        if (empty($permissions)) {
            $this->command->error('Invalid category selection.');
            return;
        }

        foreach ($permissions as $permission) {
            $selectedUser->adminPermissions()->firstOrCreate([
                'permission' => $permission,
            ]);
        }

        $this->command->info("✓ Added {$category} permission(s) to {$selectedUser->username}");
    }
}
