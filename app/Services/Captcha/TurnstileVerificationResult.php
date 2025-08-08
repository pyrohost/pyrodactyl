<?php

namespace Pterodactyl\Services\Captcha;

use Carbon\Carbon;

class TurnstileVerificationResult
{
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Check if the verification was successful
     */
    public function isSuccess(): bool
    {
        return $this->data['success'] ?? false;
    }

    /**
     * Get the challenge timestamp
     */
    public function getChallengeTimestamp(): ?Carbon
    {
        $timestamp = $this->data['challenge_ts'] ?? null;
        return $timestamp ? Carbon::parse($timestamp) : null;
    }

    /**
     * Get the hostname for which the challenge was served
     */
    public function getHostname(): ?string
    {
        return $this->data['hostname'] ?? null;
    }

    /**
     * Get the action identifier
     */
    public function getAction(): ?string
    {
        return $this->data['action'] ?? null;
    }

    /**
     * Get the customer data
     */
    public function getCdata(): ?string
    {
        return $this->data['cdata'] ?? null;
    }

    /**
     * Get error codes
     */
    public function getErrorCodes(): array
    {
        return $this->data['error-codes'] ?? [];
    }

    /**
     * Get the ephemeral ID (Enterprise only)
     */
    public function getEphemeralId(): ?string
    {
        return $this->data['metadata']['ephemeral_id'] ?? null;
    }

    /**
     * Check if the verification failed
     */
    public function isFailed(): bool
    {
        return !$this->isSuccess();
    }

    /**
     * Check if the token was invalid or expired
     */
    public function isTokenInvalid(): bool
    {
        return in_array('invalid-input-response', $this->getErrorCodes());
    }

    /**
     * Check if the token was already consumed or timed out
     */
    public function isTokenConsumed(): bool
    {
        return in_array('timeout-or-duplicate', $this->getErrorCodes());
    }

    /**
     * Check if there was an internal error
     */
    public function hasInternalError(): bool
    {
        return in_array('internal-error', $this->getErrorCodes());
    }

    /**
     * Check if the secret key was missing or invalid
     */
    public function hasSecretKeyError(): bool
    {
        return in_array('missing-input-secret', $this->getErrorCodes()) ||
               in_array('invalid-input-secret', $this->getErrorCodes());
    }

    /**
     * Check if the response parameter was missing
     */
    public function hasResponseMissing(): bool
    {
        return in_array('missing-input-response', $this->getErrorCodes());
    }

    /**
     * Check if the request was malformed
     */
    public function isBadRequest(): bool
    {
        return in_array('bad-request', $this->getErrorCodes());
    }

    /**
     * Get a human-readable error message
     */
    public function getErrorMessage(): string
    {
        if ($this->isSuccess()) {
            return '';
        }

        $errorCodes = $this->getErrorCodes();
        
        if (empty($errorCodes)) {
            return 'Verification failed for unknown reason';
        }

        $messages = [
            'missing-input-secret' => 'Secret key was not provided',
            'invalid-input-secret' => 'Secret key is invalid or does not exist',
            'missing-input-response' => 'Response token was not provided',
            'invalid-input-response' => 'Response token is invalid or has expired',
            'bad-request' => 'Request was malformed',
            'timeout-or-duplicate' => 'Response token has already been validated or has timed out',
            'internal-error' => 'Internal error occurred during validation',
        ];

        $errorMessages = [];
        foreach ($errorCodes as $code) {
            $errorMessages[] = $messages[$code] ?? "Unknown error: {$code}";
        }

        return implode('; ', $errorMessages);
    }

    /**
     * Get the raw response data
     */
    public function getRawData(): array
    {
        return $this->data;
    }

    /**
     * Validate the hostname matches the expected domain
     */
    public function validateHostname(string $expectedHostname): bool
    {
        $actualHostname = $this->getHostname();
        return $actualHostname === $expectedHostname;
    }
}