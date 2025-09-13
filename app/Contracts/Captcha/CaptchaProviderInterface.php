<?php

namespace Pterodactyl\Contracts\Captcha;

interface CaptchaProviderInterface
{
    /**
     * Get the HTML widget for the captcha.
     */
    public function getWidget(string $form): string;

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool;

    /**
     * Get the JavaScript includes needed for this captcha provider.
     */
    public function getScriptIncludes(): array;

    /**
     * Get the provider name.
     */
    public function getName(): string;

    /**
     * Get the site key for frontend use.
     */
    public function getSiteKey(): string;

    /**
     * Check if the provider is properly configured.
     */
    public function isConfigured(): bool;

    /**
     * Get the response field name for this provider.
     */
    public function getResponseFieldName(): string;
}