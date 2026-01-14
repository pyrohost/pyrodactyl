<?php

namespace Pterodactyl\Enums\Daemon;

enum DaemonType: string
{
    case WINGS = 'wings';
    case ELYTRA = 'elytra';

    private const CLASS_MAP = [
        self::WINGS->value => \Pterodactyl\Models\Daemons\Wings::class,
        self::ELYTRA->value => \Pterodactyl\Models\Daemons\Elytra::class,
    ];

    private const RESOURCE_MAP = [
        self::WINGS->value => \Pterodactyl\Http\Controllers\Api\Client\Servers\Elytra\ResourceUtilizationController::class,
        self::ELYTRA->value => \Pterodactyl\Http\Controllers\Api\Client\Servers\Wings\ResourceUtilizationController::class,
    ];

    public static function all(): array
    {
        return array_column(self::cases(), 'value', 'value');
    }

    public static function allResources(): array
    {
        return self::RESOURCE_MAP;
    }

    public static function allClass(): array
    {
        return self::CLASS_MAP;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
