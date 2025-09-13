<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class DomainFormRequest extends AdminFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $domainId = $this->route('domain')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/',
                $domainId ? "unique:domains,name,{$domainId}" : 'unique:domains,name',
            ],
            'dns_provider' => 'required|string|in:cloudflare',
            'dns_config' => 'required|array',
            'dns_config.api_token' => 'required_if:dns_provider,cloudflare|string|min:1',
            'dns_config.zone_id' => 'sometimes|string|min:1',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'A domain name is required.',
            'name.regex' => 'The domain name format is invalid.',
            'name.unique' => 'This domain is already configured.',
            'dns_provider.required' => 'A DNS provider must be selected.',
            'dns_provider.in' => 'The selected DNS provider is not supported.',
            'dns_config.required' => 'DNS configuration is required.',
            'dns_config.api_token.required_if' => 'API token is required for Cloudflare.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'domain name',
            'dns_provider' => 'DNS provider',
            'dns_config.api_token' => 'API token',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize domain name to lowercase
        if ($this->has('name')) {
            $this->merge([
                'name' => strtolower(trim($this->input('name'))),
            ]);
        }

        // Ensure boolean fields are properly cast
        foreach (['is_active', 'is_default'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }
    }
}