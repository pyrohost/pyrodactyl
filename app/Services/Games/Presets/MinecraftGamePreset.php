<?php

namespace Pterodactyl\Services\Games\Presets;

use Pterodactyl\Services\Games\GamePreset;

class MinecraftGamePreset extends GamePreset
{
    public function getName(): string
    {
        return 'minecraft';
    }

    public function getDnsRecords(): array
    {
        return [
            [
                'type' => 'A',
            ],
            [
                'type' => 'SRV',
                'service' => '_minecraft',
                'protocol' => '_tcp',
                'priority' => 0,
                'weight' => 5,
            ],
        ];
    }

    public function getDefaultPort(): int
    {
        return 25565;
    }
}