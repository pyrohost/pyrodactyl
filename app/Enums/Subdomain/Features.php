<?php

namespace Pterodactyl\Enums\Subdomain;

use Pterodactyl\Services\Subdomain\Features\FactorioSubdomainFeature;
use Pterodactyl\Services\Subdomain\Features\MinecraftSubdomainFeature;
use Pterodactyl\Services\Subdomain\Features\RustSubdomainFeature;
use Pterodactyl\Services\Subdomain\Features\ScpSlSubdomainFeature;
use Pterodactyl\Services\Subdomain\Features\TeamSpeakSubdomainFeature;
use Pterodactyl\Services\Subdomain\Features\VintageStorySubdomainFeature;


enum Features: string
{

    case FACTORIO = "subdomain_factorio";
    case MINECRAFT = "subdomain_minecraft";
    case RUST = "subdomain_rust";
    case SCPSL = "subdomain_scpsl";
    case TEAMSPEAK = "subdomain_teamspeak";
    case VINTAGESTORY = "subdomain_vintagestory";

    private const CLASS_MAP = [
        self::FACTORIO->value => FactorioSubdomainFeature::class,
        self::MINECRAFT->value => MinecraftSubdomainFeature::class,
        self::RUST->value => RustSubdomainFeature::class,
        self::SCPSL->value => ScpSlSubdomainFeature::class,
        self::TEAMSPEAK->value => TeamSpeakSubdomainFeature::class,
        self::VINTAGESTORY->value => VintageStorySubdomainFeature::class,
    ];

    public static function all(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $result[$case->value] = $case->getClassName();
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
