<?php

namespace Pterodactyl\Http\Requests\Admin;

use Pterodactyl\Models\User;
use Illuminate\Support\Collection;

class NewUserFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|min:1|max:191|unique:users,username',
            'name_first' => 'required|string|min:1|max:191',
            'name_last' => 'required|string|min:1|max:191',
            'password' => 'required|string|min:8',
            'root_admin' => 'required|boolean',
            'language' => 'required|string',
            'resources' => 'nullable|array',
            'limits' => 'nullable|array',
            'purchases_plans' => 'nullable|array',
            'coins' => 'nullable|integer'
        ];
    }

    public function normalize(?array $only = null): array
    {
        $normalized = [
            'email' => $this->input('email'),
            'username' => $this->input('username'),
            'name_first' => $this->input('name_first'),
            'name_last' => $this->input('name_last'),
            'password' => $this->input('password'),
            'root_admin' => filter_var($this->input('root_admin'), FILTER_VALIDATE_BOOLEAN),
            'language' => $this->input('language'),
            'resources' => $this->input('resources', []),
            'limits' => $this->input('limits', []),
            'purchases_plans' => $this->input('purchases_plans', []),
            'coins' => $this->input('coins', 0)
        ];

        return $only ? collect($normalized)->only($only)->toArray() : $normalized;
    }
}