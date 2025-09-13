// Main exports
export { CaptchaManager } from './CaptchaManager';
export { CaptchaProviderFactory } from './CaptchaProviderFactory';

// Types and interfaces
export type { CaptchaConfig, CaptchaProviderInterface, CaptchaRenderConfig } from './CaptchaProvider';

export { BaseCaptchaProvider } from './CaptchaProvider';

// Provider implementations
export { TurnstileProvider } from './providers/TurnstileProvider';
export { HCaptchaProvider } from './providers/HCaptchaProvider';
export { RecaptchaProvider } from './providers/RecaptchaProvider';
export { NullProvider } from './providers/NullProvider';

// Default export - singleton instance
export { default } from './CaptchaManager';
