<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Location;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\DatabaseHost;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Egg;
use Pterodactyl\Services\Servers\ServerCreationService;

class DevelopmentSeeder extends Seeder
{
    /**
     * Run the database seeds for development environment.
     */
    public function run()
    {
        // Only run in development environment
        if (!app()->environment('local')) {
            $this->command->info('Development seeder only runs in local environment.');
            return;
        }

        $this->command->info('Setting up development environment...');

        // Create dev user
        $user = $this->createDevUser();
        $this->command->info('✓ Created dev user (username: dev, password: dev)');

        // Create location
        $location = $this->createLocation();
        $this->command->info('✓ Created development location');

        // Create Wings node
        $node = $this->createNode($location);
        $this->command->info('✓ Created Wings node');

        // Create allocations for the node
        $this->createAllocations($node);
        $this->command->info('✓ Created allocations for Wings node');

        // Create database host
        $databaseHost = $this->createDatabaseHost($node);
        $this->command->info('✓ Created database host');

        // Generate Wings configuration
        $this->generateWingsConfiguration($node);
        $this->command->info('✓ Generated Wings configuration');

        // Create testing Minecraft server
        $server = $this->createTestingMinecraftServer($user, $node);
        $this->command->info('✓ Created testing Minecraft server');

        $this->command->info('Development environment setup complete!');
        $this->command->info('Panel URL: http://localhost:3000');
        $this->command->info('Username: dev');
        $this->command->info('Password: dev');
        if ($server) {
            $this->command->info('Testing Server: ' . $server->name . ' (UUID: ' . $server->uuidShort . ')');
        }
    }

    private function createDevUser(): User
    {
        // First try to find existing user by email or username
        $user = User::where('email', 'dev@pyrodactyl.local')
            ->orWhere('username', 'dev')
            ->first();

        if ($user) {
            // Update existing user
            $user->update([
                'username' => 'dev',
                'email' => 'dev@pyrodactyl.local',
                'password' => Hash::make('dev'),
                'root_admin' => true,
                'language' => 'en',
                'use_totp' => false,
            ]);
            return $user;
        }

        // Create new user
        return User::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'username' => 'dev',
            'email' => 'dev@pyrodactyl.local',
            'name_first' => 'Development',
            'name_last' => 'User',
            'password' => Hash::make('dev'),
            'root_admin' => true,
            'language' => 'en',
            'use_totp' => false,
        ]);
    }

    private function createLocation(): Location
    {
        return Location::updateOrCreate(
            ['short' => 'dev'],
            [
                'long' => 'Development Location',
            ]
        );
    }

    private function createNode(Location $location): Node
    {
        // Generate proper daemon token (64 characters as required by Node model)
        $daemonTokenId = 'dev_token_id_16c'; // 16 characters as required
        $daemonToken = 'dev_token_64_chars_fixed_for_development_environment_testing'; // 64 characters
        
        // Check if node already exists
        $existingNode = Node::where('name', 'Development Node')->first();
        
        if ($existingNode) {
            // Update existing node with proper values including UUID if missing
            $updateData = [
                'location_id' => $location->id,
                'fqdn' => 'localhost', // Public FQDN for browser websocket connections
                'internal_fqdn' => 'wings', // Internal FQDN for panel-to-Wings communication
                'scheme' => 'http',
                'behind_proxy' => false,
                'public' => true,
                'maintenance_mode' => false,
                'memory' => 8192,
                'memory_overallocate' => 0,
                'disk' => 102400,
                'disk_overallocate' => 0,
                'upload_size' => 100,
                'daemonListen' => 8080,
                'daemonSFTP' => 2022,
                'daemonBase' => '/var/lib/pterodactyl/volumes',
                'daemon_token_id' => $daemonTokenId,
                'daemon_token' => encrypt($daemonToken),
                'description' => 'Development Wings node for local testing',
            ];
            
            // Set UUID if it's missing
            if (empty($existingNode->uuid)) {
                $updateData['uuid'] = (string) \Illuminate\Support\Str::uuid();
                $this->command->info("Setting UUID for existing node: {$updateData['uuid']}");
            }
            
            $existingNode->update($updateData);
            return $existingNode;
        }

        // Create new node with UUID
        $nodeUuid = (string) \Illuminate\Support\Str::uuid();
        $node = Node::create([
            'uuid' => $nodeUuid,
            'name' => 'Development Node',
            'location_id' => $location->id,
            'fqdn' => 'localhost', // Public FQDN for browser websocket connections
            'internal_fqdn' => 'wings', // Internal FQDN for panel-to-Wings communication
            'scheme' => 'http',
            'behind_proxy' => false,
            'public' => true,
            'maintenance_mode' => false,
            'memory' => 8192,
            'memory_overallocate' => 0,
            'disk' => 102400,
            'disk_overallocate' => 0,
            'upload_size' => 100,
            'daemonListen' => 8080,
            'daemonSFTP' => 2022,
            'daemonBase' => '/var/lib/pterodactyl/volumes',
            'daemon_token_id' => $daemonTokenId,
            'daemon_token' => encrypt($daemonToken),
            'description' => 'Development Wings node for local testing',
        ]);
        
        $this->command->info("Created node with UUID: {$nodeUuid}");
        return $node;
    }

    private function createAllocations(Node $node): void
    {
        // Create a range of allocations for testing
        $ports = [25565, 25566, 25567, 25568, 25569, 8080, 8081, 8082, 8083, 8084];

        foreach ($ports as $port) {
            Allocation::updateOrCreate(
                [
                    'node_id' => $node->id,
                    'ip' => '0.0.0.0',
                    'port' => $port,
                ],
                [
                    'ip_alias' => null,
                    'server_id' => null,
                    'notes' => 'Development allocation',
                ]
            );
        }
    }


    private function createDatabaseHost(Node $node): DatabaseHost
    {
        // For development, use root user with full privileges
        $rootPassword = env('DB_ROOT_PASSWORD', 'rootpassword');
        
        return DatabaseHost::updateOrCreate(
            ['name' => 'Development Database'],
            [
                'host' => 'database',
                'port' => 3306,
                'username' => 'root',
                'password' => encrypt($rootPassword),
                'max_databases' => 100,
                'node_id' => $node->id, // Link to development node
            ]
        );
    }

    private function generateWingsConfiguration(Node $node): void
    {
        try {
            $configPath = '/etc/pterodactyl/config.yml';

            // Ensure the directory exists
            $configDir = dirname($configPath);
            if (!File::exists($configDir)) {
                File::makeDirectory($configDir, 0755, true);
            }

            // Generate the Wings configuration using the node's built-in method
            $this->command->info('Generating Wings configuration...');

            // Get the configuration directly from the node model
            $configContent = $node->getYamlConfiguration();

            // Add CORS configuration for development
            $configContent .= "\nallowed_origins: ['*']\n";

            // Update paths for Docker development environment if WINGS_DIR is set
            $wingsDir = env('WINGS_DIR');
            if ($wingsDir) {
                $this->command->info("Updating Wings paths for Docker development environment: {$wingsDir}");

                // Add system configuration section with proper Docker paths
                $systemConfig = "\nsystem:\n";
                $systemConfig .= "  root_directory: {$wingsDir}/wings/\n";
                $systemConfig .= "  log_directory: {$wingsDir}/wings/logs/\n";
                $systemConfig .= "  data: {$wingsDir}/wings/volumes\n";
                $systemConfig .= "  archive_directory: {$wingsDir}/wings/archives\n";
                $systemConfig .= "  backup_directory: {$wingsDir}/wings/backups\n";
                $systemConfig .= "  tmp_directory: {$wingsDir}/wings/tmp/\n";
                $systemConfig .= "  sftp:\n";
                $systemConfig .= "    bind_port: {$node->daemonSFTP}\n";

                $configContent .= $systemConfig;
            }

            // Write the configuration file
            File::put($configPath, $configContent);

            $this->command->info("Wings configuration saved to: {$configPath}");
            
            // Also save a backup copy for debugging
            $backupPath = storage_path('logs/wings-config-backup.yml');
            File::put($backupPath, $configContent);
            $this->command->info("Backup configuration saved to: {$backupPath}");
            
        } catch (\Exception $e) {
            $this->command->error("Failed to generate Wings configuration: " . $e->getMessage());
            $this->command->info("You may need to manually configure Wings after setup.");
            
            // Log the full error for debugging
            Log::error('Wings configuration generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'node_id' => $node->id,
            ]);
        }
    }

    private function createTestingMinecraftServer(User $user, Node $node): ?Server
    {
        // Check if testing server already exists
        $existingServer = Server::where('name', 'Testing Minecraft Server')->first();
        if ($existingServer) {
            $this->command->info('Testing Minecraft server already exists, skipping creation.');
            return $existingServer;
        }

        try {
            // Get an available allocation
            $allocation = Allocation::where('node_id', $node->id)
                ->whereNull('server_id')
                ->first();

            if (!$allocation) {
                $this->command->error('No available allocations for testing server.');
                return null;
            }

            // Get the Vanilla Minecraft egg - try multiple possible names
            $egg = Egg::whereIn('name', ['Vanilla Minecraft', 'Minecraft', 'Paper', 'Forge'])
                ->first();
            
            if (!$egg) {
                $this->command->error('No suitable Minecraft egg found. Available eggs:');
                $availableEggs = Egg::pluck('name')->toArray();
                $this->command->info('Available: ' . implode(', ', $availableEggs));
                return null;
            }

            $this->command->info("Using egg: {$egg->name}");

            // Get the default Docker image
            $dockerImages = $egg->docker_images;
            if (empty($dockerImages)) {
                $this->command->error('No Docker images available for the selected egg.');
                return null;
            }
            
            $defaultImage = is_array($dockerImages) ? array_values($dockerImages)[0] : $dockerImages;

            // Prepare server creation data with specified requirements
            $serverData = [
                'name' => 'Testing Minecraft Server',
                'description' => 'Development testing server with 4 cores, 4GB RAM, 32GB storage',
                'owner_id' => $user->id,
                'memory' => 4096, // 4GB RAM
                'overhead_memory' => 2048, // 2GB overhead memory
                'swap' => 0,
                'disk' => 32768, // 32GB storage (in MB)
                'io' => 500,
                'cpu' => 400, // 4 cores (100% per core)
                'threads' => null,
                'allocation_id' => $allocation->id,
                'node_id' => $node->id,
                'nest_id' => $egg->nest_id,
                'egg_id' => $egg->id,
                'startup' => $egg->startup,
                'image' => $defaultImage,
                'database_limit' => 8, // 8 database slots
                'allocation_limit' => 8, // 8 allocation slots
                'backup_limit' => 8, // 8 backup slots
                'skip_scripts' => false,
                'oom_disabled' => true,
                'start_on_completion' => false, // Don't auto-start in development to avoid issues
                'environment' => [
                    'SERVER_JARFILE' => 'server.jar',
                    'VANILLA_VERSION' => 'latest',
                ],
            ];

            // Use the proper ServerCreationService to create and provision the server
            $serverCreationService = app(ServerCreationService::class);
            
            $this->command->info('Creating server with ServerCreationService...');
            $server = $serverCreationService->handle($serverData);

            // Verify and fix allocation assignment if needed
            $this->ensureAllocationAssignment($server, $allocation);

            $this->command->info("Server created successfully with ID: {$server->id}");
            return $server;
            
        } catch (\Exception $e) {
            $this->command->error("Failed to create testing Minecraft server: " . $e->getMessage());
            Log::error('Server creation failed in development seeder', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'node_id' => $node->id,
            ]);
            return null;
        }
    }

    /**
     * Ensure the allocation is properly assigned to the server.
     * This fixes potential race conditions in the ServerCreationService.
     */
    private function ensureAllocationAssignment(Server $server, Allocation $allocation): void
    {
        // Refresh the allocation from database to get current state
        $allocation->refresh();
        
        // If allocation is not assigned to the server, fix it
        if ($allocation->server_id !== $server->id) {
            $this->command->info('Fixing allocation assignment...');
            $allocation->server_id = $server->id;
            $allocation->save();
            $this->command->info("Allocation {$allocation->ip}:{$allocation->port} assigned to server {$server->id}");
        }
        
        // Verify the server can see its allocations
        $serverAllocations = $server->allocations()->count();
        if ($serverAllocations === 0) {
            $this->command->warn('Server has no allocations after creation, this may cause issues.');
        } else {
            $this->command->info("Server has {$serverAllocations} allocation(s) properly assigned.");
        }
    }
}
