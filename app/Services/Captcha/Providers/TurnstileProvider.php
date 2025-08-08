<?php

namespace Pterodactyl\Services\Captcha\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Contracts\Captcha\CaptchaProviderInterface;

class TurnstileProvider implements CaptchaProviderInterface
{
    protected string $siteKey;
    protected string $secretKey;
    protected string $verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct(array $config)
    {
        $this->siteKey = $config['site_key'] ?? '';
        $this->secretKey = $config['secret_key'] ?? '';
    }

    /**
     * Get the HTML widget for the captcha.
     */
    public function getWidget(string $form): string
    {
        if (empty($this->siteKey)) {
            return '';
        }

        return sprintf(
            '<div class="cf-turnstile" data-sitekey="%s" data-callback="onTurnstileSuccess" data-error-callback="onTurnstileError" data-theme="auto" data-size="normal"></div>',
            htmlspecialchars($this->siteKey, ENT_QUOTES, 'UTF-8')
        );
    }

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool
    {
        Log::info('Turnstile verification attempt', [
            'response_length' => strlen($response),
            'response_preview' => substr($response, 0, 50) . '...',
            'remote_ip' => $remoteIp,
            'secret_key_set' => !empty($this->secretKey),
            'site_key' => $this->siteKey,
        ]);

        if (empty($this->secretKey) || empty($response)) {
            Log::warning('Turnstile verification failed: Missing secret key or response', [
                'secret_key_empty' => empty($this->secretKey),
                'response_empty' => empty($response),
            ]);
            return false;
        }

        try {
            $data = [
                'secret' => $this->secretKey,
                'response' => $response,
            ];

            if ($remoteIp) {
                $data['remoteip'] = $remoteIp;
            }

            Log::info('Sending Turnstile verification request', [
                'url' => $this->verifyUrl,
                'data_keys' => array_keys($data),
                'remote_ip' => $remoteIp,
            ]);

            $httpResponse = Http::timeout(10)
                ->asForm()
                ->post($this->verifyUrl, $data);

            Log::info('Turnstile verification response', [
                'status' => $httpResponse->status(),
                'successful' => $httpResponse->successful(),
                'body' => $httpResponse->body(),
            ]);

            if (!$httpResponse->successful()) {
                Log::warning('Turnstile verification failed: HTTP ' . $httpResponse->status(), [
                    'response_body' => $httpResponse->body(),
                ]);
                return false;
            }

            $result = $httpResponse->json();

            if (!isset($result['success'])) {
                Log::warning('Turnstile verification failed: Invalid response format', [
                    'result' => $result,
                ]);
                return false;
            }

            if (!$result['success'] && isset($result['error-codes'])) {
                Log::warning('Turnstile verification failed', [
                    'error_codes' => $result['error-codes'],
                    'full_result' => $result,
                ]);
            }

            Log::info('Turnstile verification result', [
                'success' => $result['success'],
                'full_result' => $result,
            ]);

            return (bool) $result['success'];
        } catch (\Exception $e) {
            Log::error('Turnstile verification exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Get the JavaScript includes needed for this captcha provider.
     */
    public function getScriptIncludes(): array
    {
        return [
            'https://challenges.cloudflare.com/turnstile/v0/api.js',
        ];
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'turnstile';
    }

    /**
     * Get the site key for frontend use.
     */
    public function getSiteKey(): string
    {
        return $this->siteKey;
    }

    /**
     * Check if the provider is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->siteKey) && !empty($this->secretKey);
    }

    /**
     * Get the response field name for this provider.
     */
    public function getResponseFieldName(): string
    {
        return 'cf-turnstile-response';
    }
}