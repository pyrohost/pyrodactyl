<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\ServerSubdomain;
use Pterodactyl\Transformers\Api\Client\BaseClientTransformer;

class ServerSubdomainTransformer extends BaseClientTransformer
{
    /**
     * The Fractal resource name for this transformer.
     */
    protected string $resourceName = 'server_subdomain';

    /**
     * Get the resource name for the transformer.
     */
    public function getResourceName(): string
    {
        return $this->resourceName;
    }

    /**
     * Transform a ServerSubdomain model into a representation for the client API.
     */
    public function transform(ServerSubdomain $model): array
    {
        return [
            'subdomain' => $model->subdomain,
            'domain' => $model->domain->name,
            'domain_id' => $model->domain_id,
            'full_domain' => $model->full_domain,
            'record_type' => $model->record_type,
            'is_active' => $model->is_active,
            'created_at' => $model->created_at->toISOString(),
            'updated_at' => $model->updated_at->toISOString(),
        ];
    }
}