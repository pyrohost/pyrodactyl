<?php
namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\CaptchaSettingsFormRequest;

class CaptchaController extends Controller
{
  /**
   * @var \Prologue\Alerts\AlertsMessageBag
   */
  protected $alert;

  /**
   * @var \Pterodactyl\Contracts\Repository\SettingsRepositoryInterface
   */
  protected $settings;

  /**
   * CaptchaController constructor.
   */
  public function __construct(
    AlertsMessageBag $alert,
    SettingsRepositoryInterface $settings
  ) {
    $this->alert = $alert;
    $this->settings = $settings;
  }

  /**
   * Render CAPTCHA settings page.
   */
  public function index(): View
  {
    return view('admin.settings.captcha', [
      'providers' => [
        'none' => 'Disabled',
        'hcaptcha' => 'hCaptcha',
        'mcaptcha' => 'mCaptcha',
        'turnstile' => 'Cloudflare Turnstile',
        'friendly' => 'Friendly Captcha',
        'recaptcha' => 'Recaptcha V3'
      ],
      'current' => [
        'driver' => $this->settings->get('settings::captcha:driver', 'none'),
        'hcaptcha' => [
          'site_key' => $this->settings->get('settings::captcha:hcaptcha:site_key', ''),
          'secret_key' => $this->settings->get('settings::captcha:hcaptcha:secret_key', ''),
        ],
        'mcaptcha' => [
          'site_key' => $this->settings->get('settings::captcha:mcaptcha:site_key', ''),
          'secret_key' => $this->settings->get('settings::captcha:mcaptcha:secret_key', ''),
          'endpoint' => $this->settings->get('settings::captcha:mcaptcha:endpoint', ''),
        ],
        'turnstile' => [
          'site_key' => $this->settings->get('settings::captcha:turnstile:site_key', ''),
          'secret_key' => $this->settings->get('settings::captcha:turnstile:secret_key', ''),
        ],
        'friendly' => [
          'site_key' => $this->settings->get('settings::captcha:friendly:site_key', ''),
          'secret_key' => $this->settings->get('settings::captcha:friendly:secret_key', ''),
        ],
        'recaptcha' => [
          'site_key' => $this->settings->get('settings::captcha:recaptcha:site_key', ''),
          'secret_key' => $this->settings->get('settings::captcha:friendly:secret_key', ''),
        ],
      ],
    ]);
  }

  /**
   * Handle CAPTCHA settings update.
   *
   * @throws \Pterodactyl\Exceptions\Model\DataValidationException
   * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
   */
  public function update(CaptchaSettingsFormRequest $request): RedirectResponse
  {
    $data = $request->validated();
    $driver = $data['driver'];

    // Save the driver
    $this->settings->set('settings::captcha:driver', $driver);

    // Clear all provider settings first
    $providers = ['hcaptcha', 'mcaptcha', 'turnstile', 'friendly', 'recaptcha'];
    foreach ($providers as $provider) {
      $this->settings->set("settings::captcha:{$provider}:site_key", '');
      $this->settings->set("settings::captcha:{$provider}:secret_key", '');
      if ($provider === 'mcaptcha') {
        $this->settings->set("settings::captcha:{$provider}:endpoint", '');
      }
    }

    // Save the selected provider's config if enabled
    if ($driver !== 'none' && isset($data[$driver])) {
      foreach ($data[$driver] as $key => $value) {
        $this->settings->set("settings::captcha:{$driver}:{$key}", $value);
      }
    }

    $this->alert->success('CAPTCHA settings have been updated successfully.')->flash();
    return redirect()->route('admin.settings.captcha');
  }
}