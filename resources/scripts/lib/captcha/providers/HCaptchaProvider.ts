import { BaseCaptchaProvider, CaptchaRenderConfig } from '../CaptchaProvider';
import '../types';

export class HCaptchaProvider extends BaseCaptchaProvider {
    private static readonly SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js';
    private loadPromise: Promise<void> | null = null;

    getName(): string {
        return 'hcaptcha';
    }

    getScriptUrls(): string[] {
        return [HCaptchaProvider.SCRIPT_URL];
    }

    getResponseFieldName(): string {
        return 'h-captcha-response';
    }

    isLoaded(): boolean {
        return typeof window.hcaptcha !== 'undefined';
    }

    loadSdk(): Promise<void> {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        if (this.isLoaded()) {
            return Promise.resolve();
        }

        this.loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = HCaptchaProvider.SCRIPT_URL;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load hCaptcha SDK'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        await this.loadSdk();

        if (!window.hcaptcha) {
            throw new Error('hCaptcha SDK not loaded');
        }

        const widgetId = window.hcaptcha.render(container, {
            sitekey: config.siteKey,
            theme: config.theme || 'light',
            size: config.size || 'normal',
            callback: config.onSuccess,
            'error-callback': config.onError,
            'expired-callback': config.onExpired,
        });

        return widgetId;
    }

    getResponse(widgetId?: string): string | null {
        if (!window.hcaptcha) {
            return null;
        }

        return window.hcaptcha.getResponse(widgetId) || null;
    }

    reset(widgetId?: string): void {
        if (window.hcaptcha) {
            window.hcaptcha.reset(widgetId);
        }
    }

    remove(widgetId?: string): void {
        if (window.hcaptcha) {
            window.hcaptcha.remove(widgetId);
        }
    }
}
