<?php

namespace Pterodactyl\Http\Controllers\System;

use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SystemUpdateController extends Controller
{
    protected $baseScript = <<<'BASH'
#!/bin/bash
set -e
echo "🚀 Starting deployment..."
git pull origin main
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan down
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan up
echo "✅ Deployment completed successfully!"
BASH;

    public function __invoke(Request $request)
    {
        try {
            $script = $this->baseScript;
            if ($extra = $request->get('extra')) {
                $script .= "\n" . $extra;
            }

            $process = new Process(['bash', '-c', $script]);
            $process->setWorkingDirectory(base_path());
            $process->setTimeout(300);
            $process->run(function ($type, $buffer) {
                echo $buffer;
            });

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            return response()->json([
                'success' => true,
                'output' => $process->getOutput()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'output' => $process->getErrorOutput() ?? ''
            ], 500);
        }
    }
}