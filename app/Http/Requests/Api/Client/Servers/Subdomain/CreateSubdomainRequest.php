<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Models\Domain;
use Pterodactyl\Models\ServerSubdomain;

class CreateSubdomainRequest extends ClientApiRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'subdomain' => [
                'required',
                'string',
                'min:1',
                'max:63',
                'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/',
                function ($attribute, $value, $fail) {
                    if (preg_match('/[<>"\']/', $value)) {
                        $fail('Subdomain contains invalid characters.');
                        return;
                    }
                    
                    $reserved = ['www', 'mail', 'ftp', 'api', 'admin', 'root', 'panel', 
                                'localhost', 'wildcard', 'ns1', 'ns2', 'dns', 'smtp', 'pop', 
                                'imap', 'webmail', 'cpanel', 'whm', 'autodiscover', 'autoconfig'];
                    if (in_array(strtolower($value), $reserved)) {
                        $fail('This subdomain is reserved and cannot be used.');
                        return;
                    }

                    $domainId = $this->input('domain_id');
                    if ($domainId) {
                        $exists = ServerSubdomain::where('domain_id', $domainId)
                            ->where('subdomain', strtolower($value))
                            ->where('is_active', true)
                            ->exists();
                        
                        if ($exists) {
                            $fail('This subdomain is already taken.');
                        }
                    }
                },
            ],
            'domain_id' => [
                'required',
                'integer',
                'min:1',
                'exists:domains,id',
                function ($attribute, $value, $fail) {
                    $domain = Domain::where('id', $value)
                        ->where('is_active', true)
                        ->first();
                    if (!$domain) {
                        $fail('The selected domain is not available.');
                    }
                },
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Sanitize and normalize subdomain
        if ($this->has('subdomain')) {
            $subdomain = $this->input('subdomain');
            // Remove any potential harmful characters and normalize
            $subdomain = preg_replace('/[^a-z0-9-]/', '', strtolower(trim($subdomain)));
            // Remove multiple consecutive hyphens
            $subdomain = preg_replace('/-+/', '-', $subdomain);
            // Remove leading/trailing hyphens
            $subdomain = trim($subdomain, '-');
            
            $this->merge([
                'subdomain' => $subdomain,
            ]);
        }
    }
}