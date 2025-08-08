<?php
namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class CaptchaSettingsFormRequest extends AdminFormRequest
{
  public function rules(): array
  {
    $rules = [
      'driver' => 'required|in:none,hcaptcha,mcaptcha,turnstile,friendly,recaptcha',
    ];

    // Only apply validation rules for the selected driver
    $driver = $this->input('driver');
    if ($driver !== 'none') {
      $rules[$driver] = 'required|array';

      if ($driver === 'hcaptcha') {
        $rules['hcaptcha.site_key'] = 'required|string';
        $rules['hcaptcha.secret_key'] = 'required|string';
      } elseif ($driver === 'mcaptcha') {
        $rules['mcaptcha.site_key'] = 'required|string';
        $rules['mcaptcha.secret_key'] = 'required|string';
        $rules['mcaptcha.endpoint'] = 'required|url';
      } elseif ($driver === 'turnstile') {
        $rules['turnstile.site_key'] = 'required|string';
        $rules['turnstile.secret_key'] = 'required|string';
        $rules['turnstile.theme'] = 'nullable|in:auto,light,dark';
        $rules['turnstile.size'] = 'nullable|in:normal,compact,flexible';
        $rules['turnstile.appearance'] = 'nullable|in:always,execute,interaction-only';
        $rules['turnstile.action'] = 'nullable|string|max:32|regex:/^[a-zA-Z0-9_-]*$/';
        $rules['turnstile.cdata'] = 'nullable|string|max:255|regex:/^[a-zA-Z0-9_-]*$/';
      } elseif ($driver === 'friendly') {
        $rules['friendly.site_key'] = 'required|string';
        $rules['friendly.secret_key'] = 'required|string';
      } elseif ($driver === 'recaptcha') {
        $rules['recaptcha.site_key'] = 'required|string';
        $rules['recaptcha.secret_key'] = 'required|string';
      }
    }

    return $rules;
  }

  public function attributes(): array
  {
    return [
      'hcaptcha.site_key' => 'hCaptcha Site Key',
      'hcaptcha.secret_key' => 'hCaptcha Secret Key',
      'mcaptcha.site_key' => 'mCaptcha Site Key',
      'mcaptcha.secret_key' => 'mCaptcha Secret Key',
      'mcaptcha.endpoint' => 'mCaptcha Endpoint',
      'turnstile.site_key' => 'Turnstile Site Key',
      'turnstile.secret_key' => 'Turnstile Secret Key',
      'turnstile.theme' => 'Turnstile Theme',
      'turnstile.size' => 'Turnstile Size',
      'turnstile.appearance' => 'Turnstile Appearance',
      'turnstile.action' => 'Turnstile Action',
      'turnstile.cdata' => 'Turnstile Custom Data',
      'proton.site_key' => 'Proton Site Key',
      'proton.secret_key' => 'Proton Secret Key',
      'friendly.site_key' => 'Friendly Site Key',
      'friendly.secret_key' => 'Friendly Secret Key',
      'recaptcha.site_key' => 'Recaptcha Site Key',
      'recaptcha.secret_key' => 'Recaptcha Secret Key',
    ];
  }
}