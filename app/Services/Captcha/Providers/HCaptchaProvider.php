<?php

namespace Pterodactyl\Services\Captcha\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Contracts\Captcha\CaptchaProviderInterface;

class HCaptchaProvider implements CaptchaProviderInterface
{
    protected string $siteKey;
    protected string $secretKey;
    protected string $verifyUrl = 'https://api.hcaptcha.com/siteverify';

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
            '<div class="h-captcha" data-sitekey="%s" data-callback="onHCaptchaSuccess" data-error-callback="onHCaptchaError" data-theme="auto" data-size="normal"></div>',
            htmlspecialchars($this->siteKey, ENT_QUOTES, 'UTF-8')
        );
    }

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool
    {
        if (empty($this->secretKey) || empty($response)) {
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

            $httpResponse = Http::timeout(10)
                ->asForm()
                ->post($this->verifyUrl, $data);

            if (!$httpResponse->successful()) {
                Log::warning('hCaptcha verification failed: HTTP ' . $httpResponse->status());
                return false;
            }

            $result = $httpResponse->json();

            if (!isset($result['success'])) {
                Log::warning('hCaptcha verification failed: Invalid response format');
                return false;
            }

            if (!$result['success'] && isset($result['error-codes'])) {
                Log::warning('hCaptcha verification failed', [
                    'error_codes' => $result['error-codes'],
                ]);
            }

            return (bool) $result['success'];
        } catch (\Exception $e) {
            Log::error('hCaptcha verification exception', [
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
            'https://js.hcaptcha.com/1/api.js',
        ];
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'hcaptcha';
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
        return 'h-captcha-response';
    }
}