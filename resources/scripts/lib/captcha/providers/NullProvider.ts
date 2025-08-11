import { BaseCaptchaProvider, CaptchaRenderConfig } from '../CaptchaProvider';

export class NullProvider extends BaseCaptchaProvider {
    getName(): string {
        return 'none';
    }

    getScriptUrls(): string[] {
        return [];
    }

    getResponseFieldName(): string {
        return '';
    }

    isLoaded(): boolean {
        return true;
    }

    loadSdk(): Promise<void> {
        return Promise.resolve();
    }

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        // No-op for disabled captcha
        return '';
    }

    getResponse(widgetId?: string): string | null {
        return null;
    }

    reset(widgetId?: string): void {
        // No-op for disabled captcha
    }

    remove(widgetId?: string): void {
        // No-op for disabled captcha
    }
}
