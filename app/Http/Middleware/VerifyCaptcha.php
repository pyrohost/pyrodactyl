<?php

namespace Pterodactyl\Http\Middleware;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Events\Auth\FailedCaptcha;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Psr\Http\Client\ClientExceptionInterface;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyCaptcha
{
  private const PROVIDER_ENDPOINTS = [
    'turnstile' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'hcaptcha' => 'https://hcaptcha.com/siteverify',
    'friendly' => 'https://api.friendlycaptcha.com/api/v1/siteverify',
    'mcaptcha' => 'https://mcaptcha.org/api/siteverify',
  ];

  private const PROVIDER_FIELDS = [
    'turnstile' => 'cf-turnstile-response',
    'hcaptcha' => 'h-captcha-response',
    'friendly' => 'frc-captcha-response',
    'mcaptcha' => 'mcaptcha-response',
  ];


  public function __construct(
    private Dispatcher $dispatcher,
    private Repository $config,
    private Client $client
  ) {
  }

  public function handle(Request $request, \Closure $next): mixed
  {
    $driver = $this->config->get('captcha.driver');

    if (!$this->shouldVerifyCaptcha($driver)) {
      return $next($request);
    }

    $fieldName = self::PROVIDER_FIELDS[$driver];
    $captchaResponse = $this->getCaptchaResponseFromRequest($request, $fieldName);



    if (empty($captchaResponse)) {
      \Log::warning('CAPTCHA Middleware - Missing response token', [
        'expected_field' => $fieldName,
        'available_fields' => array_keys($request->all()),
      ]);
      $this->logAndTriggerFailure($request, $driver, 'missing_response');
      throw new HttpException(400, 'Please complete the CAPTCHA challenge.');
    }

    try {
      $result = $this->verifyWithProvider($driver, $captchaResponse, $request->ip());

      if ($this->isResponseValid($result, $request, $driver)) {
        return $next($request);
      }

      $this->logAndTriggerFailure($request, $driver, 'verification_failed', $result);
      throw new HttpException(400, 'CAPTCHA verification failed. Please try again.');

    } catch (ClientExceptionInterface $e) {
      $this->logAndTriggerFailure($request, $driver, 'service_error');
      \Log::error('CAPTCHA service error', ['error' => $e->getMessage()]);
      throw new HttpException(503, 'CAPTCHA service unavailable. Please try again later.');
    } catch (\Exception $e) {
      $this->logAndTriggerFailure($request, $driver, 'unexpected_error');
      \Log::error('CAPTCHA unexpected error', ['error' => $e->getMessage()]);
      throw new HttpException(500, 'An unexpected error occurred during CAPTCHA verification.');
    }
  }

  private function shouldVerifyCaptcha(?string $driver): bool
  {
    return $driver && array_key_exists($driver, self::PROVIDER_FIELDS);
  }

  private function getCaptchaResponseFromRequest(Request $request, string $fieldName): ?string
  {

    if ($request->isJson()) {
      $data = $request->json()->all();
      return $data['captchaData'] ?? $data[$fieldName] ?? null;
    }

    $response = $request->input($fieldName) ?? $request->input('captchaData');

    if (empty($response) && in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
      $rawInput = file_get_contents('php://input');
      if (!empty($rawInput)) {
        parse_str($rawInput, $parsed);
        $response = $parsed[$fieldName] ?? $parsed['captchaData'] ?? null;
      }
    }

    return $response;
  }

  private function verifyWithProvider(string $driver, string $response, string $remoteIp): \stdClass
  {
    $secretKey = $this->config->get("captcha.{$driver}.secret_key");

    if (empty($secretKey)) {
      throw new \RuntimeException("No secret key configured for CAPTCHA driver: {$driver}");
    }

    $params = ['secret' => $secretKey];

    if ($driver === 'turnstile') {
      $params['response'] = $response;
      $params['remoteip'] = $remoteIp;
    } elseif ($driver === 'hcaptcha') {
      $params['response'] = $response;
      $params['remoteip'] = $remoteIp;
    } elseif ($driver === 'friendly') {
      $params['solution'] = $response;
      $params['sitekey'] = $this->config->get("captcha.{$driver}.site_key");
    }


    try {
      $res = $this->client->post(self::PROVIDER_ENDPOINTS[$driver], [
        'timeout' => $this->config->get('captcha.timeout', 5),
        'json' => $params,
      ]);

      $body = $res->getBody()->getContents();
      $result = json_decode($body);

      if (json_last_error() !== JSON_ERROR_NONE) {
        \Log::error('Invalid JSON response from CAPTCHA provider', [
          'provider' => $driver,
          'response_body' => $body,
          'json_error' => json_last_error_msg()
        ]);
        throw new \RuntimeException("Invalid JSON response from {$driver} CAPTCHA provider");
      }

      return $result;
    } catch (\Exception $e) {
      \Log::error('CAPTCHA verification error', [
        'provider' => $driver,
        'error' => $e->getMessage(),
        'response' => $e->getResponse() ? $e->getResponse()->getBody()->getContents() : null
      ]);
      throw $e;
    }
  }

  private function isResponseValid(\stdClass $result, Request $request, string $driver): bool
  {
    if (!($result->success ?? false)) {

      return false;
    }

    switch ($driver) {
      case 'turnstile':
        if ($this->config->get('captcha.verify_domain', false)) {
          $expectedHost = parse_url($request->url(), PHP_URL_HOST);
          if (($result->hostname ?? null) !== $expectedHost) {
            \Log::warning('Domain verification failed', [
              'expected' => $expectedHost,
              'actual' => $result->hostname ?? 'null'
            ]);
            return false;
          }
        }
        break;
    }

    return true;
  }

  private function logAndTriggerFailure(
    Request $request,
    string $driver,
    string $reason,
    ?\stdClass $result = null
  ): void {
    $errorCodes = $result->{'error-codes'} ?? [];

    \Log::warning("CAPTCHA verification failed", [
      'driver' => $driver,
      'reason' => $reason,
      'ip' => $request->ip(),
      'path' => $request->path(),
      'method' => $request->method(),
      'error_codes' => $errorCodes,
    ]);

    $this->dispatcher->dispatch(new FailedCaptcha(
      $request->ip(),
      $driver,
      $reason,
      $errorCodes
    ));
  }
}