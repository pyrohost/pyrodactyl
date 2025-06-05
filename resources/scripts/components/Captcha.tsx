// components/Captcha.tsx
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState } from 'react';

interface CaptchaProps {
    sitekey?: string;
    endpoint?: string;
    driver: 'none' | 'hcaptcha' | 'mcaptcha' | 'turnstile' | 'friendly' | 'recaptcha';
    onVerify: (token: string) => void;
    onError: () => void;
    onExpire: () => void;
}

export default ({ driver, sitekey, endpoint, onVerify, onError, onExpire }: CaptchaProps) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (driver !== 'none' && !loaded) {
            // Load any required external scripts here if needed
            setLoaded(true);
        }
    }, [driver]);

    if (driver === 'hcaptcha') {
        return <HCaptcha sitekey={sitekey || ''} onVerify={onVerify} onError={onError} onExpire={onExpire} />;
    }

    if (driver === 'turnstile') {
        return <Turnstile siteKey={sitekey || ''} onSuccess={onVerify} onError={onError} onExpire={onExpire} />;
    }

    if (driver === 'mcaptcha') {
        // TODO: Maybe make this work one day
        return <Turnstile siteKey={sitekey || ''} onSuccess={onVerify} onError={onError} onExpire={onExpire} />;
    }
    if (driver === 'recaptcha') {
        // TODO: Maybe make this work one day
        return <Turnstile siteKey={sitekey || ''} onSuccess={onVerify} onError={onError} onExpire={onExpire} />;
    }

    return null;
};
