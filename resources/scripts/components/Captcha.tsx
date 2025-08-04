import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import { useStoreState } from 'easy-peasy';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import FriendlyCaptcha from '@/components/FriendlyCaptcha';

interface CaptchaProps {
    onVerify: (token: string) => void;
    onError: (provider: string) => void;
    onExpire: () => void;
}

export interface CaptchaRef {
    reset: () => void;
    getToken: () => string;
    getFormData: () => Record<string, string>;
}

const Captcha = forwardRef<CaptchaRef, CaptchaProps>(({ onVerify, onError, onExpire }, ref) => {
    const turnstileRef = useRef(null);
    const friendlyCaptchaRef = useRef<{ reset: () => void }>(null);
    const hCaptchaRef = useRef<HCaptcha>(null);

    const [token, setToken] = useState('');
    const [friendlyLoaded, setFriendlyLoaded] = useState(false);

    const settings = useStoreState((state) => state.settings.data);
    const captcha = settings?.captcha;

    const isTurnstileEnabled = captcha?.driver === 'turnstile' && captcha.turnstile?.siteKey;
    const isFriendlyEnabled = captcha?.driver === 'friendly' && captcha.friendly?.siteKey;
    const isHCaptchaEnabled = captcha?.driver === 'hcaptcha' && captcha.hcaptcha?.siteKey;
    const isMCaptchaEnabled = captcha?.driver === 'mcaptcha' && captcha.mcaptcha?.siteKey;

    useEffect(() => {
        if (isFriendlyEnabled && !window.friendlyChallenge) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/friendly-challenge@0.9.12/widget.module.min.js';
            script.async = true;
            script.defer = true;
            script.onload = () => setFriendlyLoaded(true);
            document.body.appendChild(script);
        } else if (isFriendlyEnabled) {
            setFriendlyLoaded(true);
        }
    }, [isFriendlyEnabled]);

    const resetCaptcha = () => {
        setToken('');
        if (isTurnstileEnabled && turnstileRef.current) {
            // @ts-expect-error - The type doesn't expose the reset method directly
            turnstileRef.current.reset();
        }
        if (isFriendlyEnabled && friendlyCaptchaRef.current) {
            friendlyCaptchaRef.current.reset();
        }
        if (isHCaptchaEnabled && hCaptchaRef.current) {
            hCaptchaRef.current.resetCaptcha();
        }
    };

    const handleCaptchaComplete = (response: string) => {
        setToken(response);
        onVerify(response);
    };

    const handleCaptchaError = (provider: string) => {
        setToken('');
        onError(provider);
    };

    const handleCaptchaExpire = () => {
        setToken('');
        onExpire();
    };

    const getFormData = (): Record<string, string> => {
        if (!token) return {};
        if (!captcha || !captcha.driver) return {};

        if (captcha.driver === 'turnstile') {
            return { 'cf-turnstile-response': token };
        } else if (captcha.driver === 'hcaptcha') {
            return { 'h-captcha-response': token };
        } else if (captcha.driver === 'friendly') {
            return { 'frc-captcha-response': token };
        } else if (captcha.driver === 'mcaptcha') {
            return { 'g-recaptcha-response': token };
        }

        return {};
    };

    useImperativeHandle(ref, () => ({
        reset: resetCaptcha,
        getToken: () => token,
        getFormData,
    }));

    if (
        !settings ||
        !captcha ||
        captcha.driver === 'none' ||
        (!isTurnstileEnabled && !isFriendlyEnabled && !isHCaptchaEnabled && !isMCaptchaEnabled)
    ) {
        return null;
    }

    return (
        <>
            {isTurnstileEnabled && (
                <Turnstile
                    ref={turnstileRef}
                    siteKey={captcha.turnstile!.siteKey}
                    onSuccess={handleCaptchaComplete}
                    onError={() => handleCaptchaError('Turnstile')}
                    onExpire={handleCaptchaExpire}
                    options={{
                        theme: 'dark',
                        size: 'flexible',
                    }}
                />
            )}

            {isFriendlyEnabled && friendlyLoaded && (
                <div className='w-full'>
                    <FriendlyCaptcha
                        ref={friendlyCaptchaRef}
                        sitekey={captcha.friendly!.siteKey}
                        onComplete={handleCaptchaComplete}
                        onError={() => handleCaptchaError('FriendlyCaptcha')}
                        onExpire={handleCaptchaExpire}
                    />
                </div>
            )}

            {isHCaptchaEnabled && (
                <HCaptcha
                    ref={hCaptchaRef}
                    sitekey={captcha.hcaptcha!.siteKey}
                    onVerify={handleCaptchaComplete}
                    onError={() => handleCaptchaError('hCaptcha')}
                    onExpire={handleCaptchaExpire}
                    theme='dark'
                    size='normal'
                />
            )}

            {isMCaptchaEnabled && <p className='text-red-500'>mCaptcha implementation needed</p>}
        </>
    );
});

Captcha.displayName = 'Captcha';

export default Captcha;
