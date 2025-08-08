<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Events\Auth\FailedCaptcha;
use Pterodactyl\Services\Captcha\TurnstileService;
use Pterodactyl\Services\Captcha\TurnstileException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyCaptcha
{
    public function __construct(
        private Dispatcher $dispatcher,
        private Repository $config,
        private TurnstileService $turnstileService
    ) {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $driver = $this->config->get('captcha.driver');

        // Skip verification if captcha is disabled or not Turnstile
        if ($driver !== 'turnstile' || !$this->turnstileService->isEnabled()) {
            return $next($request);
        }

        try {
            $this->verifyTurnstileToken($request);
            return $next($request);
        } catch (TurnstileException $e) {
            $this->logAndTriggerFailure($request, 'turnstile', $e->getMessage());
            throw new HttpException(400, 'CAPTCHA verification failed: ' . $e->getMessage());
        } catch (\Exception $e) {
            $this->logAndTriggerFailure($request, 'turnstile', 'unexpected_error');
            Log::error('CAPTCHA unexpected error', ['error' => $e->getMessage()]);
            throw new HttpException(500, 'An unexpected error occurred during CAPTCHA verification.');
        }
    }

    /**
     * Verify Turnstile token according to official documentation
     */
    private function verifyTurnstileToken(Request $request): void
    {
        // Extract token from request
        $token = $this->turnstileService->getTokenFromRequest($request);

        if (empty($token)) {
            throw new TurnstileException('Please complete the CAPTCHA challenge.');
        }

        // Get visitor's IP address
        $remoteIp = $this->getVisitorIpAddress($request);

        // Generate idempotency key for potential retries
        $idempotencyKey = $this->turnstileService->generateIdempotencyKey();

        // Verify token with Turnstile Siteverify API
        $result = $this->turnstileService->verify($token, $remoteIp, $idempotencyKey);

        if ($result->isFailed()) {
            // Handle specific error cases
            if ($result->isTokenInvalid()) {
                throw new TurnstileException('Invalid or expired CAPTCHA token. Please try again.');
            }

            if ($result->isTokenConsumed()) {
                throw new TurnstileException('CAPTCHA token has already been used or has timed out. Please refresh and try again.');
            }

            if ($result->hasInternalError()) {
                throw new TurnstileException('CAPTCHA service temporarily unavailable. Please try again.');
            }

            if ($result->hasSecretKeyError()) {
                Log::error('Turnstile secret key configuration error', [
                    'error_codes' => $result->getErrorCodes()
                ]);
                throw new TurnstileException('CAPTCHA configuration error. Please contact support.');
            }

            // Generic error message for other failures
            throw new TurnstileException($result->getErrorMessage() ?: 'CAPTCHA verification failed. Please try again.');
        }

        // Additional validation: verify hostname if domain verification is enabled
        if ($this->config->get('captcha.verify_domain', false)) {
            $expectedHostname = parse_url($request->url(), PHP_URL_HOST);
            if (!$result->validateHostname($expectedHostname)) {
                Log::warning('Turnstile hostname verification failed', [
                    'expected' => $expectedHostname,
                    'actual' => $result->getHostname()
                ]);
                throw new TurnstileException('CAPTCHA domain verification failed.');
            }
        }

        // Log successful verification for monitoring
        Log::info('Turnstile verification successful', [
            'hostname' => $result->getHostname(),
            'challenge_ts' => $result->getChallengeTimestamp()?->toISOString(),
            'action' => $result->getAction(),
            'ip' => $remoteIp,
        ]);
    }

    /**
     * Get the visitor's IP address with proper header handling
     */
    private function getVisitorIpAddress(Request $request): string
    {
        // Check for Cloudflare's CF-Connecting-IP header first
        if ($request->hasHeader('CF-Connecting-IP')) {
            return $request->header('CF-Connecting-IP');
        }

        // Check for other common proxy headers
        $headers = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
        ];

        foreach ($headers as $header) {
            if ($request->server($header)) {
                $ips = explode(',', $request->server($header));
                return trim($ips[0]);
            }
        }

        // Fallback to standard IP
        return $request->ip();
    }

    /**
     * Log failure and trigger event
     */
    private function logAndTriggerFailure(Request $request, string $driver, string $reason): void
    {
        Log::warning('CAPTCHA verification failed', [
            'driver' => $driver,
            'reason' => $reason,
            'ip' => $request->ip(),
            'path' => $request->path(),
            'method' => $request->method(),
            'user_agent' => $request->userAgent(),
        ]);

        $this->dispatcher->dispatch(new FailedCaptcha(
            $request->ip(),
            $driver,
            $reason,
            []
        ));
    }
}