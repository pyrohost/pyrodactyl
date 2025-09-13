<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

/**
 * Request validation for server operation queries.
 *
 * Validates operation ID format and ensures proper authorization
 * for accessing server operation information.
 */
class ServerOperationRequest extends ClientApiRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('settings.egg', $this->route()->parameter('server'));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'operation_id' => 'required|string|uuid',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'operation_id.required' => 'An operation ID is required.',
            'operation_id.uuid' => 'The operation ID must be a valid UUID.',
        ];
    }
}