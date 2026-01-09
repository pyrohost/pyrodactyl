<?php

namespace Pterodactyl\Services\Captcha;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Manager;
use Pterodactyl\Services\Captcha\Providers\TurnstileProvider;
use Pterodactyl\Services\Captcha\Providers\HCaptchaProvider;
use Pterodactyl\Services\Captcha\Providers\RecaptchaProvider;
use Pterodactyl\Services\Captcha\Providers\NullProvider;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class CaptchaManager extends Manager
{
    protected SettingsRepositoryInterface $settings;

    public function __construct($app, SettingsRepositoryInterface $settings)
    {
        parent::__construct($app);
        $this->settings = $settings;
    }

    /**
     * Get the default driver name.
     */
    public function getDefaultDriver(): string
    {
        return $this->settings->get('settings::pterodactyl:captcha:provider', 'none');
    }

    /**
     * Create the null captcha driver (no captcha).
     */
    public function createNoneDriver(): NullProvider
    {
        return new NullProvider();
    }

    /**
     * Create the Turnstile captcha driver.
     */
    public function createTurnstileDriver(): TurnstileProvider
    {
        return new TurnstileProvider([
            'site_key' => config('pterodactyl.captcha.turnstile.site_key', ''),
            'secret_key' => config('pterodactyl.captcha.turnstile.secret_key', ''),
        ]);
    }

    /**
     * Create the hCaptcha captcha driver.
     */
    public function createHcaptchaDriver(): HCaptchaProvider
    {
        return new HCaptchaProvider([
            'site_key' => config('pterodactyl.captcha.hcaptcha.site_key', ''),
            'secret_key' => config('pterodactyl.captcha.hcaptcha.secret_key', ''),
        ]);
    }

    /**
     * Create the reCAPTCHA captcha driver.
     */
    public function createRecaptchaDriver(): RecaptchaProvider
    {
        return new RecaptchaProvider([
            'site_key' => config('pterodactyl.captcha.recaptcha.site_key', ''),
            'secret_key' => config('pterodactyl.captcha.recaptcha.secret_key', ''),
        ]);
    }

    /**
     * Get the captcha widget HTML.
     */
    public function getWidget(): string
    {


        if ($this->getDefaultDriver() === 'none') {
            return '';
        }

        return $this->driver()->getWidget('default');
    }

    /**
     * Verify a captcha response.
     */
    public function verify(string $response, ?string $remoteIp = null): bool
    {
        if ($this->getDefaultDriver() === 'none') {
            return true;
        }

        return $this->driver()->verify($response, $remoteIp);
    }

    /**
     * Get the JavaScript includes needed for the captcha.
     */
    public function getScriptIncludes(): array
    {
        if ($this->getDefaultDriver() === 'none') {
            return [];
        }

        return $this->driver()->getScriptIncludes();
    }
}
