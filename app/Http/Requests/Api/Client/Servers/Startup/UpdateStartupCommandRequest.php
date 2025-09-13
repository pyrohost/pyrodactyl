<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Startup;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateStartupCommandRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_STARTUP_COMMAND;
    }

    public function rules(): array
    {
        return [
            'startup' => 'required|string|min:1|max:10000',
        ];
    }

    public function attributes(): array
    {
        return [
            'startup' => 'startup command',
        ];
    }
}