<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Pterodactyl\Models\Egg;
use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

/**
 * Request validation for applying egg configuration changes.
 *
 * Validates egg selection, Docker images, startup commands, and environment
 * variables with comprehensive cross-validation.
 */
class ApplyEggChangeRequest extends ClientApiRequest
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
            'docker_image' => 'sometimes|string|max:255',
            'startup_command' => 'sometimes|string|max:2048',
            'environment' => 'sometimes|array|max:50',
            'environment.*' => 'nullable|string|max:1024',
            'should_backup' => 'sometimes|boolean',
            'should_wipe' => 'sometimes|boolean',
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
                    return;
                }

                if ($this->filled('docker_image')) {
                    $dockerImages = array_values($egg->docker_images ?? []);
                    if (!empty($dockerImages) && !in_array($this->input('docker_image'), $dockerImages)) {
                        $validator->errors()->add('docker_image', 'The selected Docker image is not allowed for this egg.');
                    }
                }

                if ($this->filled('environment')) {
                    $eggVariables = $egg->variables()->pluck('env_variable')->toArray();
                    foreach ($this->input('environment', []) as $key => $value) {
                        if (!in_array($key, $eggVariables)) {
                            $validator->errors()->add("environment.{$key}", 'This environment variable is not valid for the selected egg.');
                        }
                    }
                }
            }
        });
    }
}