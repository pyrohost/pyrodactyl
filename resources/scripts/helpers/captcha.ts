// Export the new modular captcha system

export type {
	CaptchaConfig,
	CaptchaProviderInterface,
	CaptchaRenderConfig,
} from "@/lib/captcha";
export {
	CaptchaProviderFactory,
	default as CaptchaManager,
	default,
} from "@/lib/captcha";
