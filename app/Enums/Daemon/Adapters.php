<?php

namespace Pterodactyl\Enums\Daemon;

use Illuminate\Support\Facades\Log;

enum Adapters: string
{

    case ADAPTER_WINGS = 'wings';
    case ADAPTER_WINGS_S3 = 's3';
    case ADAPTER_ELYTRA = 'elytra';
    case ADAPTER_RUSTIC_LOCAL = 'rustic_local';
    case ADAPTER_RUSTIC_S3 = 'rustic_s3';

    private const ELYTRA = [
        self::ADAPTER_ELYTRA, // NOTE: This is local storage without Rustic
        self::ADAPTER_RUSTIC_LOCAL,
        self::ADAPTER_RUSTIC_S3,
    ];

    private const WINGS = [
        self::ADAPTER_WINGS, // NOTE: This is local storage
        self::ADAPTER_WINGS_S3,
    ];

    public static function all(): array
    {
        return array_column(self::cases(), 'value', 'value');
    }

    public static function all_sorted(): array
    {
        return ['elytra' => self::all_elytra(), 'wings' => self::all_wings()];
    }


    public static function all_elytra(): array
    {
        return array_column(self::ELYTRA, "value");
    }

    public static function all_wings(): array
    {
        return array_column(self::WINGS, "value");
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
