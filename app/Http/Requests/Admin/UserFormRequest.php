<?php

namespace Pterodactyl\Http\Requests\Admin;

use Pterodactyl\Models\User;
use Illuminate\Support\Collection;

class UserFormRequest extends AdminFormRequest 
{
    public function rules(): array 
    {
        $rules = [
            'email' => 'required|email|unique:users,email,' . $this->route('user')->id,
            'username' => 'required|string|min:1|max:191|unique:users,username,' . $this->route('user')->id,
            'name_first' => 'required|string|min:1|max:191',
            'name_last' => 'required|string|min:1|max:191',
            'password' => 'sometimes|nullable|string|min:8',
            'root_admin' => 'sometimes|boolean',
            'language' => 'required|string|min:2|max:5',
            'resources' => 'sometimes|nullable|json',
            'limits' => 'sometimes|nullable|json'
        ];

        return $rules;
    }

    public function normalize(?array $only = null): array
    {
        $data = $this->validated();

        // Remove password if not provided
        if (empty($data['password'])) {
            unset($data['password']);
        }

        // Handle resources and limits
        if (isset($data['resources'])) {
            $data['resources'] = json_decode($data['resources'], true);
        }

        if (isset($data['limits'])) {
            $data['limits'] = json_decode($data['limits'], true);
        }

        return $data;
    }
}