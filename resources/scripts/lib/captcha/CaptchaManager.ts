import { CaptchaConfig, CaptchaProviderInterface, CaptchaRenderConfig } from './CaptchaProvider';
import { CaptchaProviderFactory } from './CaptchaProviderFactory';
// Import types from the types file
import './types';

export class CaptchaManager {
    private static instance: CaptchaManager;
    private config: CaptchaConfig;
    private provider: CaptchaProviderInterface;
    private widgetId: string | null = null;

    private constructor() {
        this.config = window.SiteConfiguration?.captcha || {
            enabled: false,
            provider: 'none',
            siteKey: '',
            scriptIncludes: [],
        };

        this.provider = CaptchaProviderFactory.create(this.config.provider);
    }

    public static getInstance(): CaptchaManager {
        if (!CaptchaManager.instance) {
            CaptchaManager.instance = new CaptchaManager();
        }
        return CaptchaManager.instance;
    }

    /**
     * Check if captcha is enabled
     */
    public isEnabled(): boolean {
        return this.config.enabled && this.config.provider !== 'none';
    }

    /**
     * Get the current provider name
     */
    public getProvider(): string {
        return this.config.provider;
    }

    /**
     * Get the site key
     */
    public getSiteKey(): string {
        return this.config.siteKey;
    }

    /**
     * Get the current provider instance
     */
    public getProviderInstance(): CaptchaProviderInterface {
        return this.provider;
    }

    /**
     * Load the captcha SDK scripts
     */
    public async loadSdk(): Promise<void> {
        if (!this.isEnabled()) {
            return;
        }

        await this.provider.loadSdk();
    }

    /**
     * Render a captcha widget
     */
    public async renderWidget(
        container: string | HTMLElement,
        options: Partial<CaptchaRenderConfig> = {},
    ): Promise<string | null> {
        if (!this.isEnabled()) {
            return null;
        }

        const containerElement =
            typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : container;

        if (!containerElement) {
            return null;
        }

        // Remove any existing widget first
        if (this.widgetId) {
            this.provider.remove(this.widgetId);
            this.widgetId = null;
        }

        try {
            const config: CaptchaRenderConfig = {
                siteKey: this.config.siteKey,
                theme: 'auto',
                size: 'normal',
                onSuccess: (token: string) => this.handleSuccess(token),
                onError: (error: any) => this.handleError(error),
                onExpired: () => this.handleExpired(),
                ...options,
            };

            const widgetId = await this.provider.render(containerElement, config);

            if (widgetId) {
                this.widgetId = widgetId;
            }

            return widgetId;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get the response token from the widget
     */
    public getResponse(): string | null {
        if (!this.isEnabled()) {
            return null;
        }

        return this.widgetId ? this.provider.getResponse(this.widgetId) : null;
    }

    /**
     * Reset the widget
     */
    public resetWidget(): void {
        if (!this.isEnabled() || !this.widgetId) {
            return;
        }

        this.provider.reset(this.widgetId);
    }

    /**
     * Remove the widget
     */
    public removeWidget(): void {
        if (!this.isEnabled()) {
            return;
        }

        if (this.widgetId) {
            this.provider.remove(this.widgetId);
            this.widgetId = null;
        }
    }

    /**
     * Create or update a hidden input field for form submission
     */
    public createHiddenInput(formElement: HTMLFormElement): HTMLInputElement | null {
        if (!this.isEnabled()) {
            return null;
        }

        const fieldName = this.provider.getResponseFieldName();
        if (!fieldName) {
            return null;
        }

        // Remove existing hidden input if it exists
        const existingInput = formElement.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
        if (existingInput) {
            existingInput.remove();
        }

        // Create new hidden input
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = fieldName;
        input.value = this.getResponse() || '';

        formElement.appendChild(input);
        return input;
    }

    /**
     * Handle successful captcha completion
     */
    private handleSuccess(token: string): void {
        // Update hidden input if it exists
        const fieldName = this.provider.getResponseFieldName();
        const input = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
        if (input) {
            input.value = token;
        }

        // Dispatch custom event
        window.dispatchEvent(
            new CustomEvent('captcha:success', {
                detail: { token, provider: this.config.provider },
            }),
        );
    }

    /**
     * Handle captcha error
     */
    private handleError(error: any): void {
        // Dispatch custom event
        window.dispatchEvent(
            new CustomEvent('captcha:error', {
                detail: { error, provider: this.config.provider },
            }),
        );
    }

    /**
     * Handle captcha expiration
     */
    private handleExpired(): void {
        // Dispatch custom event
        window.dispatchEvent(
            new CustomEvent('captcha:expired', {
                detail: { provider: this.config.provider },
            }),
        );
    }
}

// Export singleton instance
export default CaptchaManager.getInstance();
