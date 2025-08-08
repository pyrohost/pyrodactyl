<?php

namespace Pterodactyl\Services\Captcha;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Contracts\Config\Repository;
use Psr\Http\Client\ClientExceptionInterface;

class TurnstileService
{
    private const SITEVERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    private const TOKEN_FIELD = 'cf-turnstile-response';
    private const MAX_TOKEN_LENGTH = 2048;
    private const TOKEN_VALIDITY_SECONDS = 300;

    public function __construct(
        private Client $client,
        private Repository $config
    ) {
    }

    /**
     * Verify a Turnstile token using the Siteverify API
     *
     * @param string $token The Turnstile response token
     * @param string|null $remoteIp The visitor's IP address
     * @param string|null $idempotencyKey Optional UUID for retry functionality
     * @return TurnstileVerificationResult
     * @throws TurnstileException
     */
    public function verify(string $token, ?string $remoteIp = null, ?string $idempotencyKey = null): TurnstileVerificationResult
    {
        $this->validateToken($token);
        
        $secretKey = $this->config->get('captcha.turnstile.secret_key');
        if (empty($secretKey)) {
            throw new TurnstileException('Turnstile secret key is not configured');
        }

        $params = [
            'secret' => $secretKey,
            'response' => $token,
        ];

        // Add optional parameters
        if ($remoteIp) {
            $params['remoteip'] = $remoteIp;
        }

        if ($idempotencyKey) {
            $params['idempotency_key'] = $idempotencyKey;
        }

        try {
            $response = $this->client->post(self::SITEVERIFY_ENDPOINT, [
                'form_params' => $params, // Use form_params for application/x-www-form-urlencoded
                'timeout' => $this->config->get('captcha.timeout', 5),
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
            ]);

            $body = $response->getBody()->getContents();
            $result = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new TurnstileException('Invalid JSON response from Turnstile API: ' . json_last_error_msg());
            }

            return new TurnstileVerificationResult($result);

        } catch (ClientExceptionInterface $e) {
            throw new TurnstileException('Turnstile API request failed: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Extract Turnstile token from request
     */
    public function getTokenFromRequest(Request $request): ?string
    {
        // Try different methods to get the token
        $token = $request->input(self::TOKEN_FIELD) 
            ?? $request->input('captchaData')
            ?? $request->json(self::TOKEN_FIELD)
            ?? $request->json('captchaData');

        // Fallback: parse raw input for form data
        if (empty($token) && in_array($request->method(), ['POST', 'PUT', 'PATCH'])) {
            $rawInput = file_get_contents('php://input');
            if (!empty($rawInput)) {
                parse_str($rawInput, $parsed);
                $token = $parsed[self::TOKEN_FIELD] ?? $parsed['captchaData'] ?? null;
            }
        }

        return $token;
    }

    /**
     * Validate token format and length
     */
    private function validateToken(string $token): void
    {
        if (empty($token)) {
            throw new TurnstileException('Token cannot be empty');
        }

        if (strlen($token) > self::MAX_TOKEN_LENGTH) {
            throw new TurnstileException('Token exceeds maximum length of ' . self::MAX_TOKEN_LENGTH . ' characters');
        }
    }

    /**
     * Generate a UUID for idempotency
     */
    public function generateIdempotencyKey(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Check if Turnstile is enabled
     */
    public function isEnabled(): bool
    {
        return $this->config->get('captcha.driver') === 'turnstile' 
            && !empty($this->config->get('captcha.turnstile.secret_key'))
            && !empty($this->config->get('captcha.turnstile.site_key'));
    }
}