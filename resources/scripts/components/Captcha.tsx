import React from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import TurnstileWidget from './TurnstileWidget';
import FriendlyCaptcha from './FriendlyCaptcha';

interface CaptchaProps {
    sitekey?: string;
    endpoint?: string;
    driver: 'none' | 'hcaptcha' | 'mcaptcha' | 'turnstile' | 'friendly' | 'recaptcha';
    onVerify: (token: string) => void;
    onError: () => void;
    onExpire: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'flexible';
    action?: string;
    cData?: string;
    className?: string;
}

const Captcha = React.forwardRef<any, CaptchaProps>(
    ({ driver, sitekey, theme = 'auto', size = 'normal', action, cData, onVerify, onError, onExpire, className }, ref) => {
        if (driver === 'hcaptcha' && sitekey) {
            return (
                <HCaptcha
                    ref={ref}
                    sitekey={sitekey}
                    onVerify={onVerify}
                    onError={onError}
                    onExpire={onExpire}
                    theme={theme === 'auto' ? 'dark' : theme}
                    size={size === 'flexible' ? 'normal' : size}
                />
            );
        }

        if (driver === 'turnstile' && sitekey) {
            return (
                <TurnstileWidget
                    ref={ref}
                    siteKey={sitekey}
                    theme={theme}
                    size={size}
                    action={action}
                    cData={cData}
                    onSuccess={onVerify}
                    onError={onError}
                    onExpire={onExpire}
                    className={className}
                    appearance="always"
                    execution="render"
                    retry="auto"
                    refreshExpired="auto"
                    refreshTimeout="auto"
                />
            );
        }

        if (driver === 'friendly' && sitekey) {
            return (
                <FriendlyCaptcha
                    ref={ref}
                    sitekey={sitekey}
                    onComplete={onVerify}
                    onError={onError}
                    onExpire={onExpire}
                />
            );
        }

        if (driver === 'mcaptcha') {
            return (
                <div className="text-red-500 text-sm">
                    mCaptcha implementation needed
                </div>
            );
        }

        if (driver === 'recaptcha') {
            return (
                <div className="text-red-500 text-sm">
                    reCAPTCHA implementation needed
                </div>
            );
        }

        return null;
    }
);

Captcha.displayName = 'Captcha';

export default Captcha;
