import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

interface FriendlyCaptchaProps {
    sitekey: string;
    onComplete: (response: string) => void;
    onError: () => void;
    onExpire: () => void;
}

const FriendlyCaptcha = forwardRef(({ sitekey, onComplete, onError, onExpire }: FriendlyCaptchaProps, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const widgetRef = React.useRef<{
        reset: () => void;
        destroy: () => void;
    } | null>(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (widgetRef.current) {
                widgetRef.current.reset();
            }
        },
    }));

    useEffect(() => {
        if (!window.friendlyChallenge) return;

        if (containerRef.current) {
            widgetRef.current = new window.friendlyChallenge.WidgetInstance(
                containerRef.current,
                {
                    startMode: 'auto',
                    doneCallback: onComplete,
                    errorCallback: onError,
                    expiredCallback: onExpire,
                },
                { sitekey },
            );
        }

        return () => {
            if (widgetRef.current) {
                widgetRef.current.destroy();
            }
        };
    }, [sitekey, onComplete, onError, onExpire]);

    return <div ref={containerRef} className='frc-captcha dark' data-sitekey={sitekey} />;
});

FriendlyCaptcha.displayName = 'FriendlyCaptcha';

export default FriendlyCaptcha;
