<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class RemoveSubdomainRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [];
    }

    public function authorize(): bool
    {
        return $this->user()->can('server.settings', $this->route()->parameter('server'));
    }
}