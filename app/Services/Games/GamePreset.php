<?php

namespace Pterodactyl\Services\Games;

abstract class GamePreset
{
    abstract public function getName(): string;
    abstract public function getDnsRecords(): array;
    abstract public function getDefaultPort(): int;

    /**
     * Check if this game supports subdomains.
     */
    public function supportsSubdomains(): bool
    {
        return true;
    }
}