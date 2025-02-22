<?php

namespace Pterodactyl\Models;

use Carbon\Carbon;
use Pterodactyl\Rules\Username;
use Illuminate\Support\Collection;
use Pterodactyl\Facades\Activity;
use Illuminate\Validation\Rules\In;
use Illuminate\Auth\Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Pterodactyl\Models\Traits\HasAccessTokens;
use Illuminate\Auth\Passwords\CanResetPassword;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Pterodactyl\Notifications\SendPasswordReset as ResetPasswordNotification;


/**
 * Pterodactyl\Models\User.
 *
 * @property int $id
 * @property string|null $external_id
 * @property string $uuid
 * @property string $username
 * @property string $email
 * @property string|null $name_first
 * @property string|null $name_last
 * @property string $password
 * @property string|null $remember_token
 * @property string $language
 * @property bool $root_admin
 * @property bool $use_totp
 * @property string|null $totp_secret
 * @property \Illuminate\Support\Carbon|null $totp_authenticated_at
 * @property bool $gravatar
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\ApiKey[] $apiKeys
 * @property int|null $api_keys_count
 * @property string $name
 * @property \Illuminate\Notifications\DatabaseNotificationCollection|\Illuminate\Notifications\DatabaseNotification[] $notifications
 * @property int|null $notifications_count
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\RecoveryToken[] $recoveryTokens
 * @property int|null $recovery_tokens_count
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\Server[] $servers
 * @property int|null $servers_count
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\UserSSHKey[] $sshKeys
 * @property int|null $ssh_keys_count
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\ApiKey[] $tokens
 * @property int|null $tokens_count
 *
 * @method static \Database\Factories\UserFactory factory(...$parameters)
 * @method static Builder|User newModelQuery()
 * @method static Builder|User newQuery()
 * @method static Builder|User query()
 * @method static Builder|User whereCreatedAt($value)
 * @method static Builder|User whereEmail($value)
 * @method static Builder|User whereExternalId($value)
 * @method static Builder|User whereGravatar($value)
 * @method static Builder|User whereId($value)
 * @method static Builder|User whereLanguage($value)
 * @method static Builder|User whereNameFirst($value)
 * @method static Builder|User whereNameLast($value)
 * @method static Builder|User wherePassword($value)
 * @method static Builder|User whereRememberToken($value)
 * @method static Builder|User whereRootAdmin($value)
 * @method static Builder|User whereTotpAuthenticatedAt($value)
 * @method static Builder|User whereTotpSecret($value)
 * @method static Builder|User whereUpdatedAt($value)
 * @method static Builder|User whereUseTotp($value)
 * @method static Builder|User whereUsername($value)
 * @method static Builder|User whereUuid($value)
 *
 * @mixin \Eloquent
 */

class User extends Model implements
    AuthenticatableContract,
    AuthorizableContract,
    CanResetPasswordContract
{
    use Authenticatable;
    use Authorizable;
    use AvailableLanguages;
    use CanResetPassword;
    use HasAccessTokens;
    use Notifiable;
    use HasFactory;

    public const USER_LEVEL_USER = 0;
    public const USER_LEVEL_ADMIN = 1;
    public const RESOURCE_NAME = 'user';

    protected string $accessLevel = 'all';
    protected $table = 'users';

    protected $fillable = [
        'external_id',
        'uuid',
        'username',
        'email',
        'name_first',
        'name_last',
        'password',
        'language',
        'use_totp',
        'totp_secret',
        'totp_authenticated_at',
        'gravatar',
        'root_admin',
        'resources',
        'limits',
        'purchases_plans',
        'activated_plans',
        'coins'
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'totp_secret',
        'totp_authenticated_at'
    ];

    protected $casts = [
        'root_admin' => 'boolean',
        'use_totp' => 'boolean',
        'gravatar' => 'boolean',
        'totp_authenticated_at' => 'datetime',
        'resources' => 'array',
        'limits' => 'array',
        'purchases_plans' => 'array',
        'activated_plans' => 'array',
    ];

    protected $attributes = [
        'external_id' => null,
        'root_admin' => false,
        'language' => 'en',
        'use_totp' => false,
        'totp_secret' => null,
        'resources' => '[]',
        'limits' => '[]',
        'purchases_plans' => '[]',
       
    ];

    public static array $validationRules = [
        'uuid' => 'required|string|size:36|unique:users,uuid',
        'email' => 'required|email|between:1,191|unique:users,email',
        'external_id' => 'sometimes|nullable|string|max:191|unique:users,external_id',
        'username' => 'required|between:1,191|unique:users,username',
        'name_first' => 'required|string|between:1,191',
        'name_last' => 'required|string|between:1,191',
        'password' => 'sometimes|nullable|string',
        'root_admin' => 'boolean',
        'language' => 'string',
        'use_totp' => 'boolean',
        'totp_secret' => 'nullable|string',
        'resources' => 'sometimes|nullable|json',
        'limits' => 'sometimes|nullable|json',
    ];

    protected function getDefaultLimits(): array
    {
        return [
            'cpu' => (float) env('IN_CPU', 0.5),
            'memory' => (int) env('IN_RAM', 512),
            'disk' => (int) env('IN_DISK', 512),
            'servers' => (int) env('IN_SERVERS', 1),
            'allocations' => (int) env('IN_ALLOCATIONS', 1),
            'backups' => (int) env('IN_BACKUPS', 0),
            'databases' => (int) env('IN_DATABASES', 0),
        ];
    }

    protected function getDefaultResources(): array 
    {
        return [
            'cpu' => 0,
            'memory' => 0,
            'disk' => 0,
            'servers' => 0,
            'allocations' => 0,
            'backups' => 0,
            'databases' => 0,
        ];
    }

    /**
     * Update the user's activated plans based on their servers' plans.
     *
     * @return void
     */
    public function updateActivatedPlans()
    {
        $servers = $this->servers; // Assuming the User model has a 'servers' relationship
        $activatedPlans = [];

        foreach ($servers as $server) {
            if (isset($server->plan)) {
                foreach ($server->plan as $planName => $planDetails) {
                    if (isset($activatedPlans[$planName])) {
                        $activatedPlans[$planName]['count'] = ($activatedPlans[$planName]['count'] ?? 0) + 1;
                    } else {
                        $activatedPlans[$planName] = [
                            'plan_id' => $planDetails['id'] ?? null,
                            'name' => $planName,
                            'count' => 1,
                            'activated_on' => now()->toDateTimeString()
                        ];
                    }
                }
            }
        }

        $this->update([
            'activated_plans' => $activatedPlans
        ]);
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        parent::booted();

        static::retrieved(function ($user) {
            $user->updateResourceUsage();
            $user->updateActivatedPlans();
        });

        static::saved(function ($user) {
            $user->updateActivatedPlans();
        });

        static::created(function ($user) {
            $freePlan = Plan::where('name', 'Free Tier')->first();

            if ($freePlan) {
                $user->purchases_plans = [
                    'Free Tier' => [
                        'plan_id' => $freePlan->id,
                        'name' => 'Free Tier',
                        'count' => 1,
                        'activated_on' => now()->toDateTimeString(),
                    ]
                ];

                $user->save();
            }
        });
    }

    public function updateResourceUsage(): void
{
    $resources = [
        'cpu' => 0,
        'memory' => 0,
        'disk' => 0,
        'allocations' => 0,
        'databases' => 0,
        'backups' => 0,
        'servers' => $this->servers()->count() // Add actual server count
    ];

    foreach ($this->servers as $server) {
        $resources['cpu'] += $server->cpu;
        $resources['memory'] += $server->memory;
        $resources['disk'] += $server->disk;
        $resources['allocations'] += $server->allocation_limit;
        $resources['databases'] += $server->database_limit;
        $resources['backups'] += $server->backup_limit;
    }

    if ($this->resources !== $resources) {
        $this->resources = $resources;
        $this->save();
    }
}



public function getAvailableResources(): array
{
    $this->updateResourceUsage();
    
    return [
        'cpu' => $this->limits['cpu'] - $this->resources['cpu'],
        'memory' => $this->limits['memory'] - $this->resources['memory'],
        'disk' => $this->limits['disk'] - $this->resources['disk'],
        'allocations' => $this->limits['allocations'] - $this->resources['allocations'], 
        'databases' => $this->limits['databases'] - $this->resources['databases'],
        'backups' => $this->limits['backups'] - $this->resources['backups'],
        'servers' => $this->limits['servers'] - $this->resources['servers']
    ];
}

    public function canAllocateResources(array $resources, ?Server $excludeServer = null): bool
    {
        $available = $this->getAvailableResources();
        
        // If updating existing server, add its current resources to available
        if ($excludeServer) {
            $available['cpu'] += $excludeServer->cpu;
            $available['memory'] += $excludeServer->memory;
            $available['disk'] += $excludeServer->disk;
            $available['allocations'] += $excludeServer->allocation_limit;
            $available['databases'] += $excludeServer->database_limit;
            $available['backups'] += $excludeServer->backup_limit;
        }

        return $resources['cpu'] <= $available['cpu']
            && $resources['memory'] <= $available['memory']
            && $resources['disk'] <= $available['disk']
            && $resources['allocation_limit'] <= $available['allocations']
            && $resources['database_limit'] <= $available['databases']
            && $resources['backup_limit'] <= $available['backups'];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->limits)) {
                $user->limits = $user->getDefaultLimits();
            }
            if (empty($user->resources)) {
                $user->resources = $user->getDefaultResources();
            }
        });
    }
    public function getLimitsAttribute($value)
    {
        return $value ? json_decode($value, true) : $this->getDefaultLimits();
    }

    public function getResourcesAttribute($value)
    {
        return $value ? json_decode($value, true) : $this->getDefaultResources();
    }


    public function rules(): array
{
    return [
        'email' => 'required|email|unique:users,email,' . $this->route('user')->id,
        'username' => 'required|string|min:1|max:191|unique:users,username,' . $this->route('user')->id,
        'name_first' => 'required|string|min:1|max:191',
        'name_last' => 'required|string|min:1|max:191',
        'password' => 'sometimes|nullable|string|min:8',
        'root_admin' => 'sometimes|boolean',
        'language' => 'required|string|min:2|max:5',
        'resources' => 'sometimes|json',
        'limits' => 'sometimes|json',
    ];
}

    /**
     * Implement language verification by overriding Eloquence's gather
     * rules function.
     */
    public static function getRules(): array
    {
        $rules = parent::getRules();

        $rules['language'][] = new In(array_keys((new self())->getAvailableLanguages()));
        $rules['username'][] = new Username();

        return $rules;
    }

    /**
     * Return the user model in a format that can be passed over to Vue templates.
     */
    public function toVueObject(): array
    {
        return Collection::make($this->toArray())->except(['id', 'external_id'])->toArray();
    }

    /**
     * Send the password reset notification.
     *
     * @param string $token
     */
    public function sendPasswordResetNotification($token)
    {
        Activity::event('auth:reset-password')
            ->withRequestMetadata()
            ->subject($this)
            ->log('sending password reset email');

        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Store the username as a lowercase string.
     */
    public function setUsernameAttribute(string $value)
    {
        $this->attributes['username'] = mb_strtolower($value);
    }

    /**
     * Return a concatenated result for the accounts full name.
     */
    public function getNameAttribute(): string
    {
        return trim($this->name_first . ' ' . $this->name_last);
    }

    /**
     * Returns all servers that a user owns.
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'owner_id');
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class)
            ->where('key_type', ApiKey::TYPE_ACCOUNT);
    }

    public function recoveryTokens(): HasMany
    {
        return $this->hasMany(RecoveryToken::class);
    }

    public function sshKeys(): HasMany
    {
        return $this->hasMany(UserSSHKey::class);
    }

    /**
     * Returns all the activity logs where this user is the subject — not to
     * be confused by activity logs where this user is the _actor_.
     */
    public function activity(): MorphToMany
    {
        return $this->morphToMany(ActivityLog::class, 'subject', 'activity_log_subjects');
    }

    /**
     * Returns all the servers that a user can access by way of being the owner of the
     * server, or because they are assigned as a subuser for that server.
     */
    public function accessibleServers(): Builder
    {
        return Server::query()
            ->select('servers.id', 'servers.name', 'servers.owner_id') 
            ->leftJoin('subusers', 'subusers.server_id', '=', 'servers.id')
            ->where(function (Builder $builder) {
                $builder->where('servers.owner_id', $this->id)->orWhere('subusers.user_id', $this->id);
            })
            ->groupBy('servers.id', 'servers.name', 'servers.owner_id');
    }


    public function normalize(?array $only = null): array
{
    $data = $this->validated();
    
    if (empty($data['password'])) {
        unset($data['password']);
    }

    return $data;
}
}


