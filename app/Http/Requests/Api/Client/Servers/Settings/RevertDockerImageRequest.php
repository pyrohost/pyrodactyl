<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Webmozart\Assert\Assert;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class RevertDockerImageRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_STARTUP_DOCKER_IMAGE;
    }

    public function rules(): array
    {
        /** @var Server $server */
        $server = $this->route()->parameter('server');

        Assert::isInstanceOf($server, Server::class);

        return [
            'confirm' => 'required|boolean|accepted',
        ];
    }

    public function messages(): array
    {
        return [
            'confirm.required' => 'You must confirm that you understand this action cannot be undone without administrator assistance.',
            'confirm.accepted' => 'You must confirm that you understand this action cannot be undone without administrator assistance.',
        ];
    }

    /**
     * Check if the server has a custom docker image that can be reverted.
     */
    public function authorize(): bool
    {
        if (!parent::authorize()) {
            return false;
        }

        /** @var Server $server */
        $server = $this->route()->parameter('server');

        try {
            // Check if the current image is not in the egg's allowed images
            // This indicates it was set by an administrator as a custom image
            return $server->hasCustomDockerImage();
        } catch (\RuntimeException $e) {
            // If there's an issue with the egg configuration, deny access
            return false;
        }
    }
}