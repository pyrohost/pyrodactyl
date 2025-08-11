import { BaseCaptchaProvider, CaptchaRenderConfig } from '../CaptchaProvider';
import '../types';

export class RecaptchaProvider extends BaseCaptchaProvider {
    private loadPromise: Promise<void> | null = null;
    private siteKey: string = '';

    getName(): string {
        return 'recaptcha';
    }

    getScriptUrls(): string[] {
        // For reCAPTCHA v3, we need to include the site key in the script URL
        return [`https://www.google.com/recaptcha/api.js?render=${this.siteKey}`];
    }

    getResponseFieldName(): string {
        return 'g-recaptcha-response';
    }

    isLoaded(): boolean {
        return typeof window.grecaptcha !== 'undefined';
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
            script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                if (window.grecaptcha) {
                    window.grecaptcha.ready(() => {
                        resolve();
                    });
                } else {
                    resolve();
                }
            };

            script.onerror = () => {
                reject(new Error('Failed to load reCAPTCHA SDK'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        this.siteKey = config.siteKey;
        await this.loadSdk();

        if (!window.grecaptcha) {
            throw new Error('reCAPTCHA SDK not loaded');
        }

        // For reCAPTCHA v3, we don't render a visible widget
        // Instead, we create a hidden input and execute the captcha programmatically
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = this.getResponseFieldName();
        hiddenInput.id = 'g-recaptcha-response';
        container.appendChild(hiddenInput);

        // Execute reCAPTCHA v3 and get the token
        return new Promise((resolve, reject) => {
            if (!window.grecaptcha) {
                reject(new Error('reCAPTCHA not loaded'));
                return;
            }

            window.grecaptcha.ready(() => {
                if (!window.grecaptcha) {
                    reject(new Error('reCAPTCHA not available'));
                    return;
                }

                window.grecaptcha
                    .execute(config.siteKey, { action: 'submit' })
                    .then((token: string) => {
                        hiddenInput.value = token;
                        if (config.onSuccess) {
                            config.onSuccess(token);
                        }
                        resolve('recaptcha-v3');
                    })
                    .catch((error: any) => {
                        if (config.onError) {
                            config.onError(error);
                        }
                        reject(error);
                    });
            });
        });
    }

    getResponse(widgetId?: string): string | null {
        // For reCAPTCHA v3, get the token from the hidden input
        const input = document.getElementById('g-recaptcha-response') as HTMLInputElement;
        return input ? input.value : null;
    }

    reset(widgetId?: string): void {
        // For reCAPTCHA v3, clear the hidden input and re-execute
        const input = document.getElementById('g-recaptcha-response') as HTMLInputElement;
        if (input) {
            input.value = '';
            if (window.grecaptcha && this.siteKey) {
                window.grecaptcha.ready(() => {
                    if (!window.grecaptcha) return;

                    window.grecaptcha
                        .execute(this.siteKey, { action: 'submit' })
                        .then((token: string) => {
                            input.value = token;
                        })
                        .catch(() => {
                            // Silently handle errors during reset
                        });
                });
            }
        }
    }

    remove(widgetId?: string): void {
        // For reCAPTCHA v3, remove the hidden input
        const input = document.getElementById('g-recaptcha-response');
        if (input) {
            input.remove();
        }
    }
}
