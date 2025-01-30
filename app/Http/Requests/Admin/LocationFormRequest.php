<?php

namespace Pterodactyl\Http\Requests\Admin;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class LocationFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $location = $this->route('location');
        
        return [
            'short' => [
                'required',
                'string',
                'between:1,60',
                Rule::unique('locations', 'short')->ignore($location?->id),
            ],
            'long' => 'required|string|max:191',
            'flag_url' => 'nullable|url',
            'maximum_servers' => 'present|integer|min:0',
            'required_plans' => 'nullable|array',
            'required_rank' => 'present|array|nullable'
        ];
    }

    public function normalize(): array
    {
        $data = $this->validated();
        
        // Ensure required_rank is array
        if (isset($data['required_rank']) && !is_array($data['required_rank'])) {
            $data['required_rank'] = [$data['required_rank']];
        }
        
        return $data;
    }
}