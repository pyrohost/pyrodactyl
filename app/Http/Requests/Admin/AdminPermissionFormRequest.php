<?php

namespace Pterodactyl\Http\Requests\Admin;

use Pterodactyl\Models\AdminPermission;

class AdminPermissionFormRequest extends AdminFormRequest
{
    /**
     * Rules to apply to requests for updating admin permissions.
     */
    public function rules(): array
    {
        return [
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|in:' . implode(',', AdminPermission::allPermissions()),
        ];
    }

    /**
     * Normalize the request data.
     */
    public function normalize(): array
    {
        return [
            'permissions' => $this->input('permissions', []),
        ];
    }
}
