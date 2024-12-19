<?php

namespace Pterodactyl\Services;

class SystemMetricsService


{


    public function register()
    {
        $this->app->singleton(SystemMetricsService::class, function ($app) {
            return new SystemMetricsService();
        });
    }

    
    public function getUptime(): string
    {
        $uptime = shell_exec('uptime -p');
        return trim($uptime ?? 'unknown');
    }

    public function getMemoryUsage(): array
    {
        $free = shell_exec('free');
        $free = (string)trim($free);
        $free_arr = explode("\n", $free);
        $mem = explode(" ", $free_arr[1]);
        $mem = array_filter($mem);
        $mem = array_merge($mem);
        
        return [
            'total' => $this->formatBytes($mem[1] * 1024),
            'used' => $this->formatBytes($mem[2] * 1024),
            'free' => $this->formatBytes($mem[3] * 1024),
        ];
    }

    public function getCpuUsage(): float
    {
        $load = sys_getloadavg();
        return round($load[0] * 100 / 4, 2); // Assuming 4 cores
    }

    public function getDiskUsage(): array
    {
        $disk_total = disk_total_space('/');
        $disk_free = disk_free_space('/');
        
        return [
            'total' => $this->formatBytes($disk_total),
            'free' => $this->formatBytes($disk_free),
            'used' => $this->formatBytes($disk_total - $disk_free),
        ];
    }

    private function formatBytes($bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        return round($bytes / (1024 ** $pow), 2) . ' ' . $units[$pow];
    }
}