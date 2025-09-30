export interface CaptchaConfig {
    enabled: boolean;
    provider: string;
    siteKey: string;
    scriptIncludes: string[];
}

export interface CaptchaProviderInterface {
    /**
     * Get the provider name
     */
    getName(): string;

    /**
     * Get the script URLs needed for this provider
     */
    getScriptUrls(): string[];

    /**
     * Get the response field name for form submission
     */
    getResponseFieldName(): string;

    /**
     * Check if the provider's SDK is loaded
     */
    isLoaded(): boolean;

    /**
     * Load the provider's SDK
     */
    loadSdk(): Promise<void>;

    /**
     * Render the captcha widget
     */
    render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string>;

    /**
     * Get the response token from the widget
     */
    getResponse(widgetId?: string): string | null;

    /**
     * Reset the widget
     */
    reset(widgetId?: string): void;

    /**
     * Remove the widget
     */
    remove(widgetId?: string): void;
}

export interface CaptchaRenderConfig {
    siteKey: string;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'invisible' | 'flexible';
    onSuccess?: (token: string) => void;
    onError?: (error: any) => void;
    onExpired?: () => void;
}

export abstract class BaseCaptchaProvider implements CaptchaProviderInterface {
    protected widgets: Map<string, string> = new Map();

    abstract getName(): string;
    abstract getScriptUrls(): string[];
    abstract getResponseFieldName(): string;
    abstract isLoaded(): boolean;
    abstract loadSdk(): Promise<void>;
    abstract render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string>;
    abstract getResponse(widgetId?: string): string | null;
    abstract reset(widgetId?: string): void;
    abstract remove(widgetId?: string): void;

    protected setWidgetId(form: string, widgetId: string): void {
        this.widgets.set(form, widgetId);
    }

    protected getWidgetId(form: string): string | undefined {
        return this.widgets.get(form);
    }

    protected removeWidgetId(form: string): void {
        this.widgets.delete(form);
    }
}
