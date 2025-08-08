import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface TurnstileWidgetProps {
    siteKey: string;
    action?: string;
    cData?: string;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'flexible';
    tabIndex?: number;
    responseField?: boolean;
    responseFieldName?: string;
    retry?: 'auto' | 'never';
    retryInterval?: number;
    refreshExpired?: 'auto' | 'manual' | 'never';
    refreshTimeout?: 'auto' | 'manual' | 'never';
    appearance?: 'always' | 'execute' | 'interaction-only';
    execution?: 'render' | 'execute';
    feedbackEnabled?: boolean;
    onSuccess?: (token: string) => void;
    onError?: (error?: string) => void;
    onExpire?: () => void;
    onTimeout?: () => void;
    onBeforeInteractive?: () => void;
    onAfterInteractive?: () => void;
    onUnsupported?: () => void;
    className?: string;
}

export interface TurnstileWidgetRef {
    reset: () => void;
    remove: () => void;
    getResponse: () => string | undefined;
    isExpired: () => boolean;
    execute: () => void;
}


const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
    (
        {
            siteKey,
            action,
            cData,
            theme = 'auto',
            size = 'normal',
            tabIndex = 0,
            responseField = true,
            responseFieldName = 'cf-turnstile-response',
            retry = 'auto',
            retryInterval = 8000,
            refreshExpired = 'auto',
            refreshTimeout = 'auto',
            appearance = 'always',
            execution = 'render',
            feedbackEnabled = true,
            onSuccess,
            onError,
            onExpire,
            onTimeout,
            onBeforeInteractive,
            onAfterInteractive,
            onUnsupported,
            className = '',
        },
        ref
    ) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const widgetIdRef = useRef<string | undefined>(undefined);
        const scriptLoadedRef = useRef<boolean>(false);

        useImperativeHandle(ref, () => ({
            reset: () => {
                if ((window as any).turnstile && widgetIdRef.current) {
                    (window as any).turnstile.reset(widgetIdRef.current);
                }
            },
            remove: () => {
                if ((window as any).turnstile && widgetIdRef.current) {
                    (window as any).turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = undefined;
                }
            },
            getResponse: () => {
                if ((window as any).turnstile && widgetIdRef.current) {
                    return (window as any).turnstile.getResponse(widgetIdRef.current);
                }
                return undefined;
            },
            isExpired: () => {
                if ((window as any).turnstile && widgetIdRef.current) {
                    return (window as any).turnstile.isExpired(widgetIdRef.current);
                }
                return false;
            },
            execute: () => {
                if ((window as any).turnstile && containerRef.current) {
                    (window as any).turnstile.execute(containerRef.current);
                }
            },
        }));

        const loadTurnstileScript = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                if ((window as any).turnstile) {
                    resolve();
                    return;
                }

                if (scriptLoadedRef.current) {
                    // Script is already loading, wait for it
                    const checkInterval = setInterval(() => {
                        if ((window as any).turnstile) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                    return;
                }

                scriptLoadedRef.current = true;

                const script = document.createElement('script');
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
                // Note: Do NOT use async/defer when using turnstile.ready()
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Turnstile script'));

                document.head.appendChild(script);
            });
        };

        const renderWidget = () => {
            if (!(window as any).turnstile || !containerRef.current || widgetIdRef.current) {
                return;
            }

            const params: any = {
                sitekey: siteKey,
                callback: onSuccess,
                'error-callback': onError,
                'expired-callback': onExpire,
                'timeout-callback': onTimeout,
                'before-interactive-callback': onBeforeInteractive,
                'after-interactive-callback': onAfterInteractive,
                'unsupported-callback': onUnsupported,
                theme,
                size,
                tabindex: tabIndex,
                'response-field': responseField,
                'response-field-name': responseFieldName,
                retry,
                'retry-interval': retryInterval,
                'refresh-expired': refreshExpired,
                'refresh-timeout': refreshTimeout,
                appearance,
                execution,
                'feedback-enabled': feedbackEnabled,
            };

            // Add optional parameters only if they are provided
            if (action) params.action = action;
            if (cData) params.cdata = cData;

            try {
                const widgetId = (window as any).turnstile.render(containerRef.current, params);
                widgetIdRef.current = widgetId || undefined;
            } catch (error) {
                console.error('Failed to render Turnstile widget:', error);
                onError?.('Failed to render widget');
            }
        };

        useEffect(() => {
            let mounted = true;

            const initializeTurnstile = async () => {
                try {
                    await loadTurnstileScript();
                    
                    if (!mounted) return;

                    if ((window as any).turnstile) {
                        // Script is loaded, render widget directly
                        renderWidget();
                    }
                } catch (error) {
                    console.error('Failed to initialize Turnstile:', error);
                    onError?.('Failed to load Turnstile');
                }
            };

            initializeTurnstile();

            return () => {
                mounted = false;
                if ((window as any).turnstile && widgetIdRef.current) {
                    try {
                        (window as any).turnstile.remove(widgetIdRef.current);
                    } catch (error) {
                        console.warn('Failed to remove Turnstile widget:', error);
                    }
                }
                widgetIdRef.current = undefined;
            };
        }, [siteKey]);

        // Re-render widget if critical props change
        useEffect(() => {
            if (widgetIdRef.current && (window as any).turnstile) {
                // Remove existing widget and create new one
                (window as any).turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = undefined;
                renderWidget();
            }
        }, [siteKey, theme, size, action, cData]);

        return (
            <div
                ref={containerRef}
                className={`turnstile-widget ${className}`}
                data-testid="turnstile-widget"
            />
        );
    }
);

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;