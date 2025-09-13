<?php

namespace Pterodactyl\Exceptions\Dns;

use Exception;

class DnsProviderException extends Exception
{
    /**
     * Create a new DNS provider exception.
     */
    public function __construct(string $message = '', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Create an exception for connection failures.
     */
    public static function connectionFailed(string $provider, string $reason = ''): self
    {
        $message = "Failed to connect to DNS provider '{$provider}'";
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for authentication failures.
     */
    public static function authenticationFailed(string $provider): self
    {
        return new self("Authentication failed for DNS provider '{$provider}'. Please check your credentials.");
    }

    /**
     * Create an exception for invalid configuration.
     */
    public static function invalidConfiguration(string $provider, string $field): self
    {
        return new self("Invalid configuration for DNS provider '{$provider}': missing or invalid field '{$field}'.");
    }

    /**
     * Create an exception for record creation failures.
     */
    public static function recordCreationFailed(string $domain, string $subdomain, string $reason = ''): self
    {
        $message = "Failed to create DNS record for '{$subdomain}.{$domain}'";
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for record update failures.
     */
    public static function recordUpdateFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $recordList = implode(', ', $recordIds);
        $message = "Failed to update DNS records [{$recordList}] for domain '{$domain}'";
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for record deletion failures.
     */
    public static function recordDeletionFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $recordList = implode(', ', $recordIds);
        $message = "Failed to delete DNS records [{$recordList}] for domain '{$domain}'";
        if ($reason) {
            $message .= ": {$reason}";
        }
        
        return new self($message);
    }

    /**
     * Create an exception for unsupported record types.
     */
    public static function unsupportedRecordType(string $provider, string $recordType): self
    {
        return new self("DNS provider '{$provider}' does not support record type '{$recordType}'.");
    }
}