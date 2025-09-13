import { BaseCaptchaProvider, CaptchaRenderConfig } from '../CaptchaProvider';
import '../types';

export class TurnstileProvider extends BaseCaptchaProvider {
    private static readonly SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    private loadPromise: Promise<void> | null = null;

    getName(): string {
        return 'turnstile';
    }

    getScriptUrls(): string[] {
        return [TurnstileProvider.SCRIPT_URL];
    }

    getResponseFieldName(): string {
        return 'cf-turnstile-response';
    }

    isLoaded(): boolean {
        return typeof window.turnstile !== 'undefined';
    }

    loadSdk(): Promise<void> {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        if (this.isLoaded()) {
            return Promise.resolve();
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Check if script is already in DOM
            const existingScript = document.querySelector(`script[src="${TurnstileProvider.SCRIPT_URL}"]`);
            if (existingScript) {
                if (this.isLoaded()) {
                    resolve();
                    return;
                }
                // Wait for existing script to load
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile SDK')));
                return;
            }

            const script = document.createElement('script');
            script.src = TurnstileProvider.SCRIPT_URL;
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                // Wait a bit for the SDK to initialize
                setTimeout(() => {
                    if (this.isLoaded()) {
                        resolve();
                    } else {
                        reject(new Error('Turnstile SDK loaded but not available'));
                    }
                }, 100);
            };

            script.onerror = () => {
                reject(new Error('Failed to load Turnstile SDK'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        await this.loadSdk();

        if (!window.turnstile) {
            throw new Error('Turnstile SDK not loaded');
        }

        const widgetId = window.turnstile.render(container, {
            sitekey: config.siteKey,
            theme: config.theme || 'auto',
            size: config.size || 'normal',
            callback: config.onSuccess,
            'error-callback': config.onError,
            'expired-callback': config.onExpired,
        });

        return widgetId;
    }

    getResponse(widgetId?: string): string | null {
        if (!window.turnstile) {
            return null;
        }

        return window.turnstile.getResponse(widgetId) || null;
    }

    reset(widgetId?: string): void {
        if (window.turnstile) {
            window.turnstile.reset(widgetId);
        }
    }

    remove(widgetId?: string): void {
        if (window.turnstile) {
            window.turnstile.remove(widgetId);
        }
    }
}
