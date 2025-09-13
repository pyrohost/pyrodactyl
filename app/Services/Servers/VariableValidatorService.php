<?php

namespace Pterodactyl\Services\Servers;

use Illuminate\Support\Arr;
use Pterodactyl\Models\User;
use Illuminate\Support\Collection;
use Pterodactyl\Models\EggVariable;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Traits\Services\HasUserLevels;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;

class VariableValidatorService
{
    use HasUserLevels;

    /**
     * VariableValidatorService constructor.
     */
    public function __construct(private ValidationFactory $validator)
    {
    }

    /**
     * Validate all of the passed data against the given service option variables.
     *
     * @throws ValidationException
     */
    public function handle(int $egg, array $fields = []): Collection
    {
        $query = EggVariable::query()->where('egg_id', $egg);
        if (!$this->isUserLevel(User::USER_LEVEL_ADMIN)) {
            // Don't attempt to validate variables if they aren't user editable,
            // and we're not running this at an admin level.
            $query = $query->where('user_editable', true)->where('user_viewable', true);
        }

        /** @var \Pterodactyl\Models\EggVariable[] $variables */
        $variables = $query->get();

        $data = $rules = $customAttributes = [];
        foreach ($variables as $variable) {
            $value = Arr::get($fields, $variable->env_variable);
            $data['environment'][$variable->env_variable] = $value;
            
            // Make rules nullable to handle empty environment variables, but don't duplicate if already nullable
            $rules_string = $variable->rules;
            if (!str_starts_with($rules_string, 'nullable')) {
                $rules_string = 'nullable|' . $rules_string;
            }
            $rules['environment.' . $variable->env_variable] = $rules_string;
            $customAttributes['environment.' . $variable->env_variable] = trans('validation.internal.variable_value', ['env' => $variable->name]);
        }

        $validator = $this->validator->make($data, $rules, [], $customAttributes);
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return Collection::make($variables)->map(function ($item) use ($fields) {
            return (object) [
                'id' => $item->id,
                'key' => $item->env_variable,
                'value' => $fields[$item->env_variable] ?? null,
            ];
        });
    }
}
