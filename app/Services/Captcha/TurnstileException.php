<?php

namespace Pterodactyl\Services\Captcha;

use Exception;
use Throwable;

class TurnstileException extends Exception
{
    public function __construct(string $message = '', int $code = 0, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}