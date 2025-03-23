<?php

return [
  /*
   * Enable or disable captchas
   */
  'enabled' => env('TURNSTILE_ENABLED', false),

  /*
   * API endpoint for Turnstile checks.
   * The endpoint is specific to Turnstile verification.
   */
  'domain' => env('TURNSTILE_DOMAIN', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),

  /*
   * Use a custom secret key for Turnstile. Replace with your Turnstile secret key.
   */
  'secret_key' => env('TURNSTILE_SECRET_KEY', 'your-turnstile-secret-key'),

  /*
   * Use a custom website key for Turnstile. Replace with your Turnstile website key.
   */
  'website_key' => env('TURNSTILE_WEBSITE_KEY', 'your-turnstile-website-key'),

  /*
   * Turnstile doesn't require domain verification, but if you want to implement domain validation, you can.
   * Set this to false if you don't want to do domain verification.
   */
  'verify_domain' => false,  // You can change this based on your needs
];

