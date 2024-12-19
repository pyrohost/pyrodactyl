<?php

namespace Pterodactyl\Http\Controllers;


use Pterodactyl\Services\SystemMetricsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SystemStatusController extends Controller
{
    public function index(SystemMetricsService $metrics)
    {
        return view('system.status', [
            'uptime' => $metrics->getUptime(),
            'memory' => $metrics->getMemoryUsage(),
            'cpu' => $metrics->getCpuUsage(),
            'disk' => $metrics->getDiskUsage(),
            'php_version' => PHP_VERSION,
            'os' => php_uname(),
            'load' => sys_getloadavg(),
        ]);
    }
}