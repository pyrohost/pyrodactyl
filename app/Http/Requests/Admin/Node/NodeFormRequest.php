<?php

namespace Pterodactyl\Http\Requests\Admin\Node;

use Pterodactyl\Rules\Fqdn;
use Pterodactyl\Models\Node;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class NodeFormRequest extends AdminFormRequest
{
    /**
     * Get rules to apply to data in this request.
     */
    public function rules(): array
    {
        if ($this->method() === 'PATCH') {
            $rules = Node::getRulesForUpdate($this->route()->parameter('node'));
            $rules['internal_fqdn'] = ['nullable', 'string', Fqdn::make('scheme')];
            return $rules;
        }

        $data = Node::getRules();
        $data['fqdn'][] = Fqdn::make('scheme');
        $data['internal_fqdn'] = ['nullable', 'string', Fqdn::make('scheme')];

        return $data;
    }
}
