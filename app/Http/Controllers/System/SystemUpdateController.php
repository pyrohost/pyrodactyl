<?php

namespace Pterodactyl\Http\Controllers\System;

use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\Log;

class SystemUpdateController extends Controller
{
    protected $scriptPath;

    public function __construct()
    {
        $this->scriptPath = __DIR__ . '/update.sh';
    }

    public function __invoke(Request $request)
    {
        // Get password from .env
        $envPassword = config('app.update_password', env('UPDATE_PASSWORD'));
        
        // Debug logging
        Log::debug('Update request received', [
            'provided_pass' => $request->get('pass'),
            'env_pass' => $envPassword
        ]);

        // Check if password is provided
        if (!$request->has('pass')) {
            return response()->json([
                'success' => false,
                'error' => 'Password required in request'
            ], 403);
        }

        // Verify password with strict comparison
        if (strcmp($request->get('pass'), $envPassword) !== 0) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid password provided'
            ], 403);
        }

        try {
            chmod($this->scriptPath, 0755);
            
            $process = new Process([
                'sudo', 
                '-u', 
                'www-data', 
                'bash', 
                $this->scriptPath, 
                $request->get('extra', '')
            ]);
            
            $process->setWorkingDirectory(base_path());
            $process->setTimeout(300);
            $process->setEnv([
                'PASSWORD' => $envPassword,
                'DEBIAN_FRONTEND' => 'noninteractive'
            ]);

            $output = '';
            $process->run(function ($type, $buffer) use (&$output) {
                $output .= $buffer;
                echo $buffer;
            });

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            return response()->json([
                'success' => true,
                'output' => $output
            ]);

        } catch (\Exception $e) {
            Log::error('Update failed', [
                'error' => $e->getMessage(),
                'output' => $process->getErrorOutput() ?? ''
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'output' => $process->getErrorOutput() ?? ''
            ], 500);
        }
    }
}