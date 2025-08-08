<?php

namespace Pterodactyl\Services\Captcha\Providers;

use Pterodactyl\Contracts\Captcha\CaptchaProviderInterface;

class NullProvider implements CaptchaProviderInterface
{
    /**
     * Get the HTML widget for the captcha.
     */
    public function getWidget(string $form): string
    {
        return '';
    }

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool
    {
        return true;
    }

    /**
     * Get the JavaScript includes needed for this captcha provider.
     */
    public function getScriptIncludes(): array
    {
        return [];
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'none';
    }

    /**
     * Get the site key for frontend use.
     */
    public function getSiteKey(): string
    {
        return '';
    }

    /**
     * Check if the provider is properly configured.
     */
    public function isConfigured(): bool
    {
        return true; // Null provider is always "configured"
    }

    /**
     * Get the response field name for this provider.
     */
    public function getResponseFieldName(): string
    {
        return '';
    }
}