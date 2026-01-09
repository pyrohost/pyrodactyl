<?php

namespace Pterodactyl\Enums\Subdomain;

use Pterodactyl\Services\Dns\Providers\CloudflareProvider;
use Pterodactyl\Services\Dns\Providers\HetznerProvider;
use Pterodactyl\Services\Dns\Providers\Route53Provider;

enum Providers: string
{

    case CLOUDFLARE = 'cloudflare';
    case HETZNER = 'hetzner';
    case ROUTE53 = 'route53';

    private const CLASS_MAP = [
        self::CLOUDFLARE->value => CloudflareProvider::class,
        self::HETZNER->value => HetznerProvider::class,
        self::ROUTE53->value => Route53Provider::class,
    ];

    private const DESCRIPTION_MAP = [
        self::CLOUDFLARE->value => 'Cloudflare DNS service',
        self::HETZNER->value => 'Hetzner DNS Console',
        self::ROUTE53->value => 'AWS Route53 Dns Service',
    ];


    public static function all(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $result[$case->value] = self::getClass($case->value);
        }
        return $result;
    }

    /**
     * Returns providers with name and description
     */
    public static function allWithDescriptions(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $result[$case->value] = [
                "name" => $case->value,
                "description" => self::DESCRIPTION_MAP[$case->value]
            ];
        }

        return $result;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function getClassName(): string
    {
        return self::CLASS_MAP[$this->value];
    }

    public static function getClass(string $provider): string
    {
        return self::from($provider)->getClassName();
    }
}
