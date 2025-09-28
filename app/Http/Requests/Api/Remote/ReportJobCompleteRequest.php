<?php

namespace Pterodactyl\Http\Requests\Api\Remote;

use Illuminate\Foundation\Http\FormRequest;

class ReportJobCompleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'successful' => 'required|boolean',
            'job_type' => 'required|string|in:backup_create,backup_delete,backup_restore',

            // Backup-specific fields (nullable for future job types)
            'checksum' => 'nullable|string',
            'checksum_type' => 'nullable|string|in:sha1,md5',
            'size' => 'nullable|integer|min:0',
            'snapshot_id' => 'nullable|string',

            // Generic fields
            'error_message' => 'nullable|string',
            'result_data' => 'nullable|array',
        ];
    }
}