<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class CreateServerRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|min:3|max:191',
            'node_id' => 'required|exists:nodes,id',
            'egg_id' => 'required|exists:eggs,id',
            'cpu' => 'required|numeric|min:50',
            'memory' => 'required|numeric|min:256',
            'disk' => 'required|numeric|min:1024',
            'databases' => 'sometimes|numeric|min:0',
            'backups' => 'sometimes|numeric|min:0',
            'allocations' => 'sometimes|numeric|min:1',
            'docker_image' => 'sometimes|string',
            'startup' => 'sometimes|string',
        ];
    }
}