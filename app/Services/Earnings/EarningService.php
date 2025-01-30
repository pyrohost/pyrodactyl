<?php

namespace Pterodactyl\Services\Earnings;

class EarningService
{
    public function isEnabled(): bool
    {
        return config('app.earn', false);
    }
}