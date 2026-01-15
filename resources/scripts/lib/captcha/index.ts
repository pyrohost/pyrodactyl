// Main exports
// Default export - singleton instance
export { CaptchaManager, default } from "./CaptchaManager";

// Types and interfaces
export type {
	CaptchaConfig,
	CaptchaProviderInterface,
	CaptchaRenderConfig,
} from "./CaptchaProvider";

export { BaseCaptchaProvider } from "./CaptchaProvider";
export { CaptchaProviderFactory } from "./CaptchaProviderFactory";
export { HCaptchaProvider } from "./providers/HCaptchaProvider";
export { NullProvider } from "./providers/NullProvider";
export { RecaptchaProvider } from "./providers/RecaptchaProvider";
// Provider implementations
export { TurnstileProvider } from "./providers/TurnstileProvider";
