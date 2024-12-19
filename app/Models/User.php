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
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Pterodactyl\Notifications\SendPasswordReset as ResetPasswordNotification;

class User extends Model implements AuthenticatableContract, AuthorizableContract, CanResetPasswordContract
{
    use Authenticatable;
    use Authorizable;
    use Notifiable;
    use HasApiTokens;
    use CanResetPassword;
    use HasFactory;

    public const USER_LEVEL_USER = 0;
    public const USER_LEVEL_ADMIN = 1;

    protected $table = 'users';
    protected string $accessLevel = 'all';

    protected $fillable = [
        'external_id',
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
        'purchases_plans'
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
        'purchases_plans' => 'array'
    ];

    protected $attributes = [
        'external_id' => null,
        'root_admin' => false,
        'language' => 'en',
        'use_totp' => false,
        'totp_secret' => null,
        'resources' => null,
        'limits' => null,
        'purchases_plans' => null
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
    ];

    protected static function boot()
    {
        parent::boot();

        static::retrieved(function ($user) {
            if (is_null($user->limits)) {
                $user->limits = [
                    'cpu' => env('INITIAL_CPU', 80),
                    'memory' => env('INITIAL_MEMORY', 2048),
                    'disk' => env('INITIAL_DISK', 5120),
                    'servers' => env('INITIAL_SERVERS', 1),
                    'databases' => env('INITIAL_DATABASES', 0),
                    'backups' => env('INITIAL_BACKUPS', 0),
                    'allocations' => env('INITIAL_ALLOCATIONS', 2),
                ];
                $user->save();
            }

            if (is_null($user->resources)) {
                $user->resources = [
                    'cpu' => 0,
                    'memory' => 0,
                    'disk' => 0,
                    'databases' => 0,
                    'allocations' => 0,
                    'backups' => 0,
                    'servers' => 0,
                ];
                $user->save();
            }
        });
    }

    public static function getRules(): array
    {
        $rules = parent::getRules();
        $rules['language'][] = new In(array_keys((new self())->getAvailableLanguages()));
        $rules['username'][] = new Username();
        return $rules;
    }

    public function setUsernameAttribute(string $value)
    {
        $this->attributes['username'] = mb_strtolower($value);
    }

    public function getNameAttribute(): string
    {
        return trim($this->name_first . ' ' . $this->name_last);
    }

    public function toVueObject(): array
    {
        return Collection::make($this->toArray())->except(['id', 'external_id'])->toArray();
    }

    public function sendPasswordResetNotification($token)
    {
        Activity::event('auth:reset-password')
            ->withRequestMetadata()
            ->subject($this)
            ->log('sending password reset email');

        $this->notify(new ResetPasswordNotification($token));
    }

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

    public function activity(): MorphToMany
    {
        return $this->morphToMany(ActivityLog::class, 'subject', 'activity_log_subjects');
    }

    public function accessibleServers(): Builder
    {
        return Server::query()
            ->select('servers.*')
            ->leftJoin('subusers', 'subusers.server_id', '=', 'servers.id')
            ->where(function (Builder $builder) {
                $builder->where('servers.owner_id', $this->id)
                    ->orWhere('subusers.user_id', $this->id);
            })
            ->groupBy('servers.id');
    }
}