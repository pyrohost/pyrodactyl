<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Services\Captcha\CaptchaManager;
use Pterodactyl\Exceptions\DisplayException;

class VerifyCaptcha
{
    protected CaptchaManager $captcha;

    public function __construct(CaptchaManager $captcha)
    {
        $this->captcha = $captcha;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip verification if captcha is not enabled
        $defaultDriver = $this->captcha->getDefaultDriver();
        
        Log::info('VerifyCaptcha middleware triggered', [
            'default_driver' => $defaultDriver,
            'request_url' => $request->url(),
            'request_method' => $request->method(),
        ]);
        
        if ($defaultDriver === 'none') {
            Log::info('Captcha verification skipped - driver is none');
            return $next($request);
        }

        // Get the captcha response from the request
        $driver = $this->captcha->driver();
        $fieldName = $driver->getResponseFieldName();
        $captchaResponse = $request->input($fieldName);
        
        Log::info('Captcha verification details', [
            'driver_name' => $driver->getName(),
            'field_name' => $fieldName,
            'response_present' => !empty($captchaResponse),
            'response_length' => $captchaResponse ? strlen($captchaResponse) : 0,
            'all_request_keys' => array_keys($request->all()),
        ]);
        
        if (empty($captchaResponse)) {
            Log::warning('Captcha verification failed - no response provided', [
                'field_name' => $fieldName,
                'request_data' => $request->all(),
            ]);
            throw new DisplayException('Please complete the captcha verification.');
        }

        // Verify the captcha response
        $remoteIp = $request->ip();
        Log::info('Starting captcha verification', [
            'remote_ip' => $remoteIp,
            'response_preview' => substr($captchaResponse, 0, 50) . '...',
        ]);
        
        $verificationResult = $this->captcha->verify($captchaResponse, $remoteIp);
        
        Log::info('Captcha verification completed', [
            'result' => $verificationResult,
        ]);
        
        if (!$verificationResult) {
            Log::warning('Captcha verification failed - verification returned false');
            throw new DisplayException('Captcha verification failed. Please try again.');
        }

        Log::info('Captcha verification successful - proceeding with request');
        return $next($request);
    }
}
