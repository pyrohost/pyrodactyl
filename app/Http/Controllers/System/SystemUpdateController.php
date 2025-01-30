<?php

namespace Pterodactyl\Http\Controllers\System;

use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SystemUpdateController extends Controller
{
    protected $scriptPath;

    public function __construct()
    {
        $this->scriptPath = __DIR__ . '/update.sh';
    }

    public function __invoke(Request $request)
    {
        $envPassword = env('UPDATE_PASSWORD', 'Asuna#2024~S4O!');

        // Check if password is provided
        if (!$request->has('pass')) {
            return response()->json([
                'success' => false,
                'error' => 'Password required in request'
            ], 403);
        }

        // Verify password
        if ($request->get('pass') !== $envPassword) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid password'
            ], 403);
        }

        try {
            // Ensure script is executable
            chmod($this->scriptPath, 0755);

            $extra = $request->get('extra', '');
            
            // Set up process with environment variables
            $process = new Process(['sudo', '-u', 'www-data', 'bash', $this->scriptPath, $extra]);
            $process->setWorkingDirectory(base_path());
            $process->setTimeout(300);
            $process->setEnv([
                'PASSWORD' => $envPassword,
                'DEBIAN_FRONTEND' => 'noninteractive'
            ]);

            // Run process with real-time output
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
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'output' => $process->getErrorOutput() ?? ''
            ], 500);
        }
    }
}