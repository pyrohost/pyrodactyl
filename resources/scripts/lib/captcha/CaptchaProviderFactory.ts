import { CaptchaProviderInterface } from './CaptchaProvider';
import { HCaptchaProvider } from './providers/HCaptchaProvider';
import { NullProvider } from './providers/NullProvider';
import { RecaptchaProvider } from './providers/RecaptchaProvider';
import { TurnstileProvider } from './providers/TurnstileProvider';

export class CaptchaProviderFactory {
    private static providers: Map<string, () => CaptchaProviderInterface> = new Map([
        ['turnstile', () => new TurnstileProvider()],
        ['hcaptcha', () => new HCaptchaProvider()],
        ['recaptcha', () => new RecaptchaProvider()],
        ['none', () => new NullProvider()],
    ]);

    /**
     * Create a captcha provider instance
     */
    static create(providerName: string): CaptchaProviderInterface {
        const providerFactory = this.providers.get(providerName);

        if (!providerFactory) {
            console.warn(`Unknown captcha provider: ${providerName}, falling back to null provider`);
            return new NullProvider();
        }

        return providerFactory();
    }

    /**
     * Register a new captcha provider
     */
    static register(name: string, factory: () => CaptchaProviderInterface): void {
        this.providers.set(name, factory);
    }

    /**
     * Get all available provider names
     */
    static getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Check if a provider is available
     */
    static hasProvider(name: string): boolean {
        return this.providers.has(name);
    }
}
