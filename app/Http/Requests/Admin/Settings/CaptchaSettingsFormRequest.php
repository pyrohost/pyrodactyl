<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class CaptchaSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'pterodactyl:captcha:provider' => ['required', 'string', Rule::in(['none', 'turnstile', 'hcaptcha', 'recaptcha'])],
            'pterodactyl:captcha:turnstile:site_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,turnstile',
            ],
            'pterodactyl:captcha:turnstile:secret_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,turnstile',
            ],
            'pterodactyl:captcha:hcaptcha:site_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,hcaptcha',
            ],
            'pterodactyl:captcha:hcaptcha:secret_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,hcaptcha',
            ],
            'pterodactyl:captcha:recaptcha:site_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,recaptcha',
            ],
            'pterodactyl:captcha:recaptcha:secret_key' => [
                'nullable',
                'string',
                'max:255',
                'required_if:pterodactyl:captcha:provider,recaptcha',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'pterodactyl:captcha:provider' => 'Captcha Provider',
            'pterodactyl:captcha:turnstile:site_key' => 'Turnstile Site Key',
            'pterodactyl:captcha:turnstile:secret_key' => 'Turnstile Secret Key',
            'pterodactyl:captcha:hcaptcha:site_key' => 'hCaptcha Site Key',
            'pterodactyl:captcha:hcaptcha:secret_key' => 'hCaptcha Secret Key',
            'pterodactyl:captcha:recaptcha:site_key' => 'reCAPTCHA Site Key',
            'pterodactyl:captcha:recaptcha:secret_key' => 'reCAPTCHA Secret Key',
        ];
    }

    public function normalize(?array $only = null): array
    {
        $data = $this->validated();

        // Clear provider-specific settings if provider is 'none'
        if ($data['pterodactyl:captcha:provider'] === 'none') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
        }

        // Clear other provider settings when switching providers
        if ($data['pterodactyl:captcha:provider'] === 'turnstile') {
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
        } elseif ($data['pterodactyl:captcha:provider'] === 'hcaptcha') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:recaptcha:site_key'] = '';
            $data['pterodactyl:captcha:recaptcha:secret_key'] = '';
        } elseif ($data['pterodactyl:captcha:provider'] === 'recaptcha') {
            $data['pterodactyl:captcha:turnstile:site_key'] = '';
            $data['pterodactyl:captcha:turnstile:secret_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:site_key'] = '';
            $data['pterodactyl:captcha:hcaptcha:secret_key'] = '';
        }

        // Apply the $only filter if provided, similar to parent class
        if ($only !== null) {
            return array_intersect_key($data, array_flip($only));
        }

        return $data;
    }
}
