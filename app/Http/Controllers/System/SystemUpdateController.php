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
        $envPassword = env('UPDATE_PASSWORD', getenv('UPDATE_PASSWORD'));

        // Check if password is provided
        if (!$request->has('pass')) {
            return response()->json([
                'success' => false,
                'error' => 'Your have not sent us a password, Please set it via the .env'
            ], 403);
        }

        // Verify password directly against .env
        if ($request->get('pass') !== $envPassword) {
            return response()->json([
                'success' => false,
                'error' => 'WRONG PASSWORD! Update FAILED'
            ], 403);
        }

        try {
            $extra = $request->get('extra', '');
            
            $process = new Process(['bash', $this->scriptPath, $extra]);
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