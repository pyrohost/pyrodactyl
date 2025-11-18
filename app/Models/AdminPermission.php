<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pterodactyl\Models\AdminPermission.
 *
 * @property int $id
 * @property int $user_id
 * @property string $permission
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Pterodactyl\Models\User $user
 */
class AdminPermission extends Model
{
    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'admin_permission';

    /**
     * Admin permission constants - User Management
     */
    public const USER_READ = 'admin.users.read';
    public const USER_CREATE = 'admin.users.create';
    public const USER_UPDATE = 'admin.users.update';
    public const USER_DELETE = 'admin.users.delete';

    /**
     * Admin permission constants - Server Management
     */
    public const SERVER_READ = 'admin.servers.read';
    public const SERVER_CREATE = 'admin.servers.create';
    public const SERVER_UPDATE = 'admin.servers.update';
    public const SERVER_DELETE = 'admin.servers.delete';
    public const SERVER_VIEW_CONSOLE = 'admin.servers.console';

    /**
     * Admin permission constants - Node Management
     */
    public const NODE_READ = 'admin.nodes.read';
    public const NODE_CREATE = 'admin.nodes.create';
    public const NODE_UPDATE = 'admin.nodes.update';
    public const NODE_DELETE = 'admin.nodes.delete';

    /**
     * Admin permission constants - Location Management
     */
    public const LOCATION_READ = 'admin.locations.read';
    public const LOCATION_CREATE = 'admin.locations.create';
    public const LOCATION_UPDATE = 'admin.locations.update';
    public const LOCATION_DELETE = 'admin.locations.delete';

    /**
     * Admin permission constants - Database Management
     */
    public const DATABASE_READ = 'admin.databases.read';
    public const DATABASE_CREATE = 'admin.databases.create';
    public const DATABASE_UPDATE = 'admin.databases.update';
    public const DATABASE_DELETE = 'admin.databases.delete';

    /**
     * Admin permission constants - Nest & Egg Management
     */
    public const NEST_READ = 'admin.nests.read';
    public const NEST_CREATE = 'admin.nests.create';
    public const NEST_UPDATE = 'admin.nests.update';
    public const NEST_DELETE = 'admin.nests.delete';

    /**
     * Admin permission constants - Mount Management
     */
    public const MOUNT_READ = 'admin.mounts.read';
    public const MOUNT_CREATE = 'admin.mounts.create';
    public const MOUNT_UPDATE = 'admin.mounts.update';
    public const MOUNT_DELETE = 'admin.mounts.delete';

    /**
     * Admin permission constants - Settings Management
     */
    public const SETTINGS_READ = 'admin.settings.read';
    public const SETTINGS_UPDATE = 'admin.settings.update';

    /**
     * Admin permission constants - API Key Management
     */
    public const API_KEYS_READ = 'admin.api.read';
    public const API_KEYS_CREATE = 'admin.api.create';
    public const API_KEYS_DELETE = 'admin.api.delete';

    /**
     * Admin permission constants - Domain Management
     */
    public const DOMAIN_READ = 'admin.domains.read';
    public const DOMAIN_UPDATE = 'admin.domains.update';

    /**
     * Admin permission constants - Mail Settings
     */
    public const MAIL_READ = 'admin.mail.read';
    public const MAIL_UPDATE = 'admin.mail.update';

    /**
     * Admin permission constants - Advanced Settings
     */
    public const ADVANCED_READ = 'admin.advanced.read';
    public const ADVANCED_UPDATE = 'admin.advanced.update';

    /**
     * Admin permission constants - Captcha Settings
     */
    public const CAPTCHA_READ = 'admin.captcha.read';
    public const CAPTCHA_UPDATE = 'admin.captcha.update';

    /**
     * The table associated with the model.
     */
    protected $table = 'admin_permissions';

    /**
     * A list of mass-assignable variables.
     */
    protected $fillable = [
        'user_id',
        'permission',
    ];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'user_id' => 'integer',
    ];

    /**
     * Get all available admin permissions grouped by category.
     */
    public static function permissions(): array
    {
        return [
            'users' => [
                'name' => 'User Management',
                'permissions' => [
                    self::USER_READ => 'View users',
                    self::USER_CREATE => 'Create users',
                    self::USER_UPDATE => 'Update users',
                    self::USER_DELETE => 'Delete users',
                ],
            ],
            'servers' => [
                'name' => 'Server Management',
                'permissions' => [
                    self::SERVER_READ => 'View servers',
                    self::SERVER_CREATE => 'Create servers',
                    self::SERVER_UPDATE => 'Update servers',
                    self::SERVER_DELETE => 'Delete servers',
                    self::SERVER_VIEW_CONSOLE => 'Access server console',
                ],
            ],
            'nodes' => [
                'name' => 'Node Management',
                'permissions' => [
                    self::NODE_READ => 'View nodes',
                    self::NODE_CREATE => 'Create nodes',
                    self::NODE_UPDATE => 'Update nodes',
                    self::NODE_DELETE => 'Delete nodes',
                ],
            ],
            'locations' => [
                'name' => 'Location Management',
                'permissions' => [
                    self::LOCATION_READ => 'View locations',
                    self::LOCATION_CREATE => 'Create locations',
                    self::LOCATION_UPDATE => 'Update locations',
                    self::LOCATION_DELETE => 'Delete locations',
                ],
            ],
            'databases' => [
                'name' => 'Database Management',
                'permissions' => [
                    self::DATABASE_READ => 'View databases',
                    self::DATABASE_CREATE => 'Create databases',
                    self::DATABASE_UPDATE => 'Update databases',
                    self::DATABASE_DELETE => 'Delete databases',
                ],
            ],
            'nests' => [
                'name' => 'Nest & Egg Management',
                'permissions' => [
                    self::NEST_READ => 'View nests and eggs',
                    self::NEST_CREATE => 'Create nests and eggs',
                    self::NEST_UPDATE => 'Update nests and eggs',
                    self::NEST_DELETE => 'Delete nests and eggs',
                ],
            ],
            'mounts' => [
                'name' => 'Mount Management',
                'permissions' => [
                    self::MOUNT_READ => 'View mounts',
                    self::MOUNT_CREATE => 'Create mounts',
                    self::MOUNT_UPDATE => 'Update mounts',
                    self::MOUNT_DELETE => 'Delete mounts',
                ],
            ],
            'settings' => [
                'name' => 'Settings Management',
                'permissions' => [
                    self::SETTINGS_READ => 'View settings',
                    self::SETTINGS_UPDATE => 'Update settings',
                ],
            ],
            'api' => [
                'name' => 'API Key Management',
                'permissions' => [
                    self::API_KEYS_READ => 'View API keys',
                    self::API_KEYS_CREATE => 'Create API keys',
                    self::API_KEYS_DELETE => 'Delete API keys',
                ],
            ],
            'domains' => [
                'name' => 'Domain Management',
                'permissions' => [
                    self::DOMAIN_READ => 'View domains',
                    self::DOMAIN_UPDATE => 'Manage domains',
                ],
            ],
            'mail' => [
                'name' => 'Mail Settings',
                'permissions' => [
                    self::MAIL_READ => 'View mail settings',
                    self::MAIL_UPDATE => 'Update mail settings',
                ],
            ],
            'advanced' => [
                'name' => 'Advanced Settings',
                'permissions' => [
                    self::ADVANCED_READ => 'View advanced settings',
                    self::ADVANCED_UPDATE => 'Update advanced settings',
                ],
            ],
            'captcha' => [
                'name' => 'Captcha Settings',
                'permissions' => [
                    self::CAPTCHA_READ => 'View captcha settings',
                    self::CAPTCHA_UPDATE => 'Update captcha settings',
                ],
            ],
        ];
    }

    /**
     * Get a flat list of all permission keys.
     */
    public static function allPermissions(): array
    {
        $permissions = [];
        foreach (self::permissions() as $category) {
            foreach ($category['permissions'] as $key => $name) {
                $permissions[] = $key;
            }
        }
        return $permissions;
    }

    /**
     * Validation rules.
     */
    public static array $validationRules = [
        'user_id' => 'required|integer|exists:users,id',
        'permission' => 'required|string',
    ];

    /**
     * Get the user this permission belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
