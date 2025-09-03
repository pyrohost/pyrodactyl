<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain;

use Pterodactyl\Models\Domain;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class SetSubdomainRequest extends ClientApiRequest
{
    public function rules(): array
    {
        $server = $this->route()->parameter('server');
        
        return [
            'subdomain' => [
                'required',
                'string',
                'min:1',
                'max:63',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/',
                function ($attribute, $value, $fail) use ($server) {
                    // Check if subdomain is unique for the domain
                    $domainId = $this->input('domain_id');
                    if ($domainId) {
                        $exists = \Pterodactyl\Models\Server::where('subdomain', $value)
                            ->where('domain_id', $domainId)
                            ->where('id', '!=', $server->id)
                            ->exists();
                        
                        if ($exists) {
                            $fail('This subdomain is already taken on the selected domain.');
                        }
                    }
                },
            ],
            'domain_id' => [
                'required',
                'integer',
                'exists:domains,id',
                function ($attribute, $value, $fail) {
                    // Check if domain is active
                    $domain = Domain::find($value);
                    if ($domain && !$domain->is_active) {
                        $fail('The selected domain is not active.');
                    }
                },
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'subdomain' => 'Subdomain',
            'domain_id' => 'Domain',
            'subdomain_type' => 'Subdomain Type',
        ];
    }

    public function messages(): array
    {
        return [
            'subdomain.regex' => 'The subdomain format is invalid. Only letters, numbers, and hyphens are allowed.',
            'subdomain.max' => 'The subdomain cannot be longer than 63 characters.',
            'domain_id.exists' => 'The selected domain does not exist.',
            'subdomain_type.string' => 'The game type must be a valid string.',
        ];
    }

    public function authorize(): bool
    {
        return $this->user()->can('server.settings', $this->route()->parameter('server'));
    }
}