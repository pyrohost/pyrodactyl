<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SystemStatusController extends Controller
{
  /**
   * Get system metrics and status as a stream
   */
  public function index(Request $request): StreamedResponse
  {
    $response = new StreamedResponse(function() {
      // Set the content type headers for SSE
      header('Content-Type: text/event-stream');
      header('Cache-Control: no-cache');
      header('Connection: keep-alive');
      header('X-Accel-Buffering: no'); // Disable Nginx buffering (Pain in the arse)

      // Keep streaming until the connection is closed
      while (true) {
        try {
          $metrics = [
            'status' => 'running',
            'timestamp' => now()->toIso8601String(),
            'metrics' => [
              'uptime' => $this->getUptime(),
              'memory' => $this->getMemoryUsage(),
              'cpu' => $this->getCpuUsage(),
              'disk' => $this->getDiskUsage(),
            ],
            'system' => [
              'php_version' => PHP_VERSION,
              'os' => php_uname(),
              'hostname' => gethostname(),
              'load_average' => sys_getloadavg(),
            ]
          ];

          // Format data as an SSE event
          echo "event: metrics\n";
          echo "data: " . json_encode($metrics) . "\n\n";
          
          // Flush output buffer to send data immediately
          ob_flush();
          flush();
          
          // Wait before sending the next update (1 second)
          sleep(1);
          
          // Check if the client has disconnected
          if (connection_aborted()) {
            break;
          }
        } catch (\Exception $e) {
          // Send error as an event
          echo "event: error\n";
          echo "data: " . json_encode([
            'status' => 'error',
            'message' => 'Failed to retrieve system metrics',
            'error' => $e->getMessage()
          ]) . "\n\n";
          
          ob_flush();
          flush();
          
          // Continue trying after a delay
          sleep(5);
        }
      }
    });

    // Set additional headers for the response
    $response->headers->set('Content-Type', 'text/event-stream');
    $response->headers->set('Cache-Control', 'no-cache');
    $response->headers->set('Connection', 'keep-alive');
    $response->headers->set('X-Accel-Buffering', 'no');

    return $response;
  }

  private function getMemoryUsage(): array
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $memory = shell_exec('vm_stat');
      if (!$memory) {
        throw new \RuntimeException('Failed to execute vm_stat command');
      }

      // Parse memory stats more reliably
      $stats = [];
      foreach (explode("\n", $memory) as $line) {
        if (preg_match('/Pages\s+([^:]+):\s+(\d+)/', $line, $matches)) {
          $stats[strtolower($matches[1])] = (int) $matches[2];
        }
      }

      $page_size = 4096; // Default page size for macOS

      $total_memory = $this->getTotalMemoryMac();
      $free_memory = ($stats['free'] ?? 0) * $page_size;
      $used_memory = $total_memory - $free_memory;

      return [
        'total' => $total_memory,
        'used' => $used_memory,
        'free' => $free_memory,
        'page_size' => $page_size
      ];
    }

    // Linux memory calculation
    $memory = shell_exec('free -b');
    if (!$memory) {
      throw new \RuntimeException('Failed to execute free command');
    }

    if (!preg_match('/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/', $memory, $matches)) {
      throw new \RuntimeException('Failed to parse memory information');
    }

    return [
      'total' => (int) $matches[1],
      'used' => (int) $matches[2],
      'free' => (int) $matches[3]
    ];
  }

  private function getTotalMemoryMac(): int
  {
    $memory = shell_exec('sysctl hw.memsize');
    if (!$memory || !preg_match('/hw.memsize: (\d+)/', $memory, $matches)) {
      throw new \RuntimeException('Failed to get total memory size');
    }
    return (int) $matches[1];
  }

  private function getCpuUsage(): float
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $cmd = "top -l 1 | grep -E '^CPU' | awk '{print $3}' | cut -d'%' -f1";
    } else {
      $cmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'";
    }

    $usage = shell_exec($cmd);
    if ($usage === null) {
      throw new \RuntimeException('Failed to get CPU usage');
    }

    return (float) $usage;
  }

  private function getDiskUsage(): array
  {
    $total = disk_total_space('/');
    $free = disk_free_space('/');

    if ($total === false || $free === false) {
      throw new \RuntimeException('Failed to get disk space information');
    }

    return [
      'total' => $total,
      'free' => $free,
      'used' => $total - $free
    ];
  }

  private function getUptime(): int
  {
    if (PHP_OS_FAMILY === 'Darwin') {
      $uptime = shell_exec('sysctl -n kern.boottime');
      if (!$uptime || !preg_match('/sec = (\d+)/', $uptime, $matches)) {
        throw new \RuntimeException('Failed to get system uptime');
      }
      return time() - (int) $matches[1];
    }

    $uptime = @file_get_contents('/proc/uptime');
    if ($uptime === false) {
      throw new \RuntimeException('Failed to read uptime file');
    }

    return (int) floatval($uptime);
  }
}