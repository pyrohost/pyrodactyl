<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Pterodactyl\Models\Egg;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

/**
 * Request validation for previewing egg configuration changes.
 *
 * Validates egg and nest selection to ensure proper relationship
 * before showing preview information.
 */
class PreviewEggRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return 'startup.software';
    }

    public function rules(): array
    {
        return [
            'egg_id' => 'required|integer|exists:eggs,id',
            'nest_id' => 'required|integer|exists:nests,id',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->filled(['egg_id', 'nest_id'])) {
                $egg = Egg::where('id', $this->input('egg_id'))
                    ->where('nest_id', $this->input('nest_id'))
                    ->first();
                
                if (!$egg) {
                    $validator->errors()->add('egg_id', 'The selected egg does not belong to the specified nest.');
                }
            }
        });
    }
}