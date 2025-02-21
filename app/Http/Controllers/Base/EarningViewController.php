<?php

namespace Pterodactyl\Http\Controllers\Base;

use Inertia\Inertia;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Earnings\EarningService;

class EarningViewController extends Controller
{
    private EarningService $earningService;

    public function __construct(EarningService $earningService)
    {
        $this->earningService = $earningService;
    }

    public function index()
    {
        return Inertia::render('Errors/Features/Disable', [
            'isEnabled' => $this->earningService->isEnabled()
        ]);
    }
}