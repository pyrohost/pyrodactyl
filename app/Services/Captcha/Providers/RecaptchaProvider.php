<?php

namespace Pterodactyl\Services\Captcha\Providers;

use Pterodactyl\Contracts\Captcha\CaptchaProviderInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaProvider implements CaptchaProviderInterface
{
    /* private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'; */

    protected string $siteKey;
    protected string $secretKey;
    protected string $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    public function __construct(array $config)
    {
        $this->siteKey = $config['site_key'] ?? '';
        $this->secretKey = $config['secret_key'] ?? '';
    }

    public function verify(string $response, ?string $remoteIp = null): bool
    {
        if (empty($response)) {
            return false;
        }

        try {
            $httpResponse = Http::timeout(10)
                ->asForm()
                ->post($this->verifyUrl, [
                    'secret' => $this->secretKey,
                    'response' => $response,
                    'remoteip' => $remoteIp,
                ]);

            if (!$httpResponse->successful()) {
                return false;
            }

            $data = $httpResponse->json();

            // For reCAPTCHA v3, check both success and score
            if (!isset($data['success']) || $data['success'] !== true) {
                return false;
            }

            // reCAPTCHA v3 returns a score (0.0 - 1.0)
            // Use 0.5 as default threshold as recommended by Google
            $score = $data['score'] ?? 0.0;
            $threshold = 0.5;

            return $score >= $threshold;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getWidget(string $form): string
    {
        // reCAPTCHA v3 doesn't use a visible widget
        // Instead, it runs in the background and we execute it programmatically
        return sprintf(
            '<input type="hidden" id="g-recaptcha-response" name="g-recaptcha-response" />
            <script>
                document.addEventListener("DOMContentLoaded", function() {
                    if (typeof grecaptcha !== "undefined") {
                        grecaptcha.ready(function() {
                            grecaptcha.execute("%s", {action: "%s"}).then(function(token) {
                                document.getElementById("g-recaptcha-response").value = token;
                            });
                        });
                    }
                });
            </script>',
            htmlspecialchars($this->siteKey, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($form, ENT_QUOTES, 'UTF-8')
        );
    }

    public function getScriptIncludes(): array
    {
        return [sprintf('https://www.google.com/recaptcha/api.js?render=%s', $this->siteKey)];
    }

    public function getName(): string
    {
        return 'recaptcha';
    }

    public function getResponseFieldName(): string
    {
        return 'g-recaptcha-response';
    }

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
}

