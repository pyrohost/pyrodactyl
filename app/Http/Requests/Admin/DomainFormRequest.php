<?php

namespace Pterodactyl\Http\Requests\Admin;

use Pterodactyl\Models\Domain;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class DomainFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        $rules = Domain::$validationRules;

        if ($this->method() === 'PATCH') {
            // For updates, make name validation unique except for current domain
            $rules['name'] = 'required|string|min:3|max:253|regex:/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/|unique:domains,name,' . $this->route()->parameter('domain')->id;
        } else {
            // For creation, ensure name is unique
            $rules['name'] = 'required|string|min:3|max:253|regex:/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*[a-zA-Z0-9]$/|unique:domains,name';
        }

        // Add DNS config validation for Cloudflare
        if ($this->input('dns_provider') === 'cloudflare') {
            $rules['dns_config.api_token'] = 'required|string';
            $rules['dns_config.zone_id'] = 'required|string';
        }

        return $rules;
    }

    public function attributes(): array
    {
        return [
            'name' => 'Domain Name',
            'dns_provider' => 'DNS Provider',
            'dns_config' => 'DNS Configuration',
            'is_active' => 'Active Status',
            'dns_config.api_token' => 'API Token',
            'dns_config.zone_id' => 'Zone ID',
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The domain name format is invalid. Only letters, numbers, dots, and hyphens are allowed.',
            'name.unique' => 'A domain with this name already exists.',
            'dns_provider.in' => 'The selected DNS provider is not supported.',
        ];
    }

    /**
     * Normalize the request data.
     */
    public function normalize(?array $only = null): array
    {
        if ($only !== null) {
            return parent::normalize($only);
        }
        
        return [
            'name' => strtolower(trim($this->input('name'))),
            'dns_provider' => $this->input('dns_provider'),
            'dns_config' => $this->input('dns_config', []),
            'is_active' => $this->boolean('is_active', true),
        ];
    }
}