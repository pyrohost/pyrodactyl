<?php

namespace Pterodactyl\Enums\Captcha;

enum Captchas: string
{
    case NONE = 'none';
    case TURNSTILE = 'turnstile';
    case HCAPTCHA = 'hcaptcha';
    case RECAPTCHA = 'recaptcha';

    private const DESCRIPTION_MAP = [
        self::NONE->value => 'Disabled',
        self::TURNSTILE->value => 'Cloudflare Turnstile',
        self::HCAPTCHA->value => 'HCaptcha',
        self::RECAPTCHA->value => 'Google ReCaptcha',
    ];


    public static function all(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $result[$case->value] = self::DESCRIPTION_MAP[$case->value];
        }
        return $result;
    }


    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
