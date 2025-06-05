<?php

return [
  'driver' => env('CAPTCHA_DRIVER', 'none'),

  'providers' => [
    'hcaptcha' => [
      'enabled' => env('HCAPTCHA_ENABLED', false),
      'site_key' => env('HCAPTCHA_SITE_KEY'),
      'secret_key' => env('HCAPTCHA_SECRET_KEY'),
      'endpoint' => 'https://hcaptcha.com/siteverify',
    ],

    'mcaptcha' => [
      'enabled' => env('MCAPTCHA_ENABLED', false),
      'site_key' => env('MCAPTCHA_SITE_KEY'),
      'secret_key' => env('MCAPTCHA_SECRET_KEY'),
      'endpoint' => env('MCAPTCHA_ENDPOINT', 'https://mcaptcha.your-instance.com/api/v1/pow/verify'),
    ],

    'turnstile' => [
      'enabled' => env('TURNSTILE_ENABLED', false),
      'site_key' => env('TURNSTILE_SITE_KEY'),
      'secret_key' => env('TURNSTILE_SECRET_KEY'),
      'endpoint' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    ],

    'proton' => [
      'enabled' => env('PROTON_CAPTCHA_ENABLED', false),
      'site_key' => env('PROTON_CAPTCHA_SITE_KEY'),
      'secret_key' => env('PROTON_CAPTCHA_SECRET_KEY'),
      'endpoint' => 'https://api.proton.me/captcha/v3/verify',
    ],

    'friendly' => [
      'enabled' => env('FRIENDLY_CAPTCHA_ENABLED', false),
      'site_key' => env('FRIENDLY_CAPTCHA_SITE_KEY'),
      'secret_key' => env('FRIENDLY_CAPTCHA_SECRET_KEY'),
      'endpoint' => 'https://api.friendlycaptcha.com/api/v1/siteverify',
    ],

    'recaptcha' => [
      'enabled' => env('RECAPTCHA_ENABLED', false),
      'site_key' => env('RECAPTCHA_SITE_KEY'),
      'secret_key' => env('RECAPTCHA_SECRET_KEY'),
      'endpoint' => 'https://www.google.com/recaptcha/api/siteverify',
    ],
  ],

  // Global settings
  'verify_domain' => false,
  'timeout' => 5, // seconds
];
