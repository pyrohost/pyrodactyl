<?php

namespace Pterodactyl\Http\Requests\Api\Remote;

use Illuminate\Foundation\Http\FormRequest;

class ElytraJobCompleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'successful' => 'required|boolean',
            'job_type' => 'required|string',
            'status' => 'nullable|string|in:pending,running,completed,failed',
            'message' => 'nullable|string',
            'error_message' => 'nullable|string',
            'progress' => 'nullable|integer|min:0|max:100',
            'updated_at' => 'nullable|integer',

            // Generic result data (job-type specific fields can be included here)
            'checksum' => 'nullable|string',
            'checksum_type' => 'nullable|string',
            'size' => 'nullable|integer|min:0',
            'snapshot_id' => 'nullable|string',
            'adapter' => 'nullable|string',
            'result_data' => 'nullable|array',
        ];
    }
}