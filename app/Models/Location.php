<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $short
 * @property string $long
 * @property string|null $flag_url
 * @property int $maximum_servers
 * @property array|null $required_plans
 * @property int $required_rank
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property \Pterodactyl\Models\Node[] $nodes
 * @property \Pterodactyl\Models\Server[] $servers
 */
class Location extends Model
{
    public const RESOURCE_NAME = 'location';

    protected $table = 'locations';

    protected $fillable = [
        'short',
        'long',
        'flag_url',
        'maximum_servers',
        'required_plans',
        'required_rank'
    ];

    protected $casts = [
        'required_plans' => 'array',
        'maximum_servers' => 'integer',
        'required_rank' => 'array'
    ];

    protected $attributes = [
        'flag_url' => null,
        'maximum_servers' => 0,
        'required_plans' => null,
        'required_rank' => null,
    ];

    public static array $validationRules = [
        'short' => 'required|string|between:1,60|unique:locations,short',
        'long' => 'string|nullable|between:1,191',
        'flag_url' => 'nullable|string|url',
        'maximum_servers' => 'required|integer|min:0',
        'required_plans' => 'nullable|array',
        'required_rank' => 'required|array'
    ];

    /**
     * Gets all nodes associated with this location.
     */
    public function servers()
    {
        return $this->hasManyThrough(Server::class, Node::class);
    }

    public function nodes()
    {
        return $this->hasMany(Node::class);
    }

    /**
     * Returns the route key name for this model.
     */
    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    /**
     * Checks if the location has reached its maximum server limit.
     */
    public function hasReachedMaximumServers(): bool
    {
        if ($this->maximum_servers === 0) {
            return false;
        }

        return $this->servers()->count() >= $this->maximum_servers;
    }

    /**
     * Check if a user meets the rank requirement for this location.
     */
    public function userMeetsRankRequirement(int $userRank): bool
    {
        return $userRank >= $this->required_rank;
    }

    /**
     * Check if a user has the required plan for this location.
     */
    public function userHasRequiredPlan(?array $userPlans): bool
    {
        if (empty($this->required_plans)) {
            return true;
        }

        if (empty($userPlans)) {
            return false;
        }

        return !empty(array_intersect($this->required_plans, $userPlans));
    }
}