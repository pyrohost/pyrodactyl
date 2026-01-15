<?php

namespace Pterodactyl\Contracts\Daemon;

use Pterodactyl\Models\Node;

interface Daemon
{
    public function getConfiguration(Node $node): array;
    public function getAutoDeploy(Node $node, string $token): string;
}
