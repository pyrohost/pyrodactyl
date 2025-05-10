import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Initialize i18n configuration for the application
 * - Use Backend to load language files from the public/locales directory
 * - Use LanguageDetector to automatically detect language from the browser
 * - Initialize with default language as English
 */
i18n
    // Load language files from the public/locales/{lng}/translation.json directory
    .use(Backend)
    // Automatically detect language from the browser
    .use(LanguageDetector)
    // Integrate with react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        // Default language
        fallbackLng: 'en',
        // Supported languages
        supportedLngs: ['en', 'vi'],
        // Do not use dots to separate keys
        debug: false,
        // Configure loading of namespaces
        ns: ['translation'],
        defaultNS: 'translation',
        // Configure backend
        backend: {
            // Path to language files
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        // Configure language detection
        detection: {
            // Order of language detection: localStorage, cookie, navigator
            order: ['localStorage', 'cookie', 'navigator'],
            // Save language to localStorage and cookie
            caches: ['localStorage', 'cookie'],
        },
        // Configure interpolation
        interpolation: {
            // React has already handled XSS so we don't need to escape values
            escapeValue: false,
        },
        // Configure react-i18next
        react: {
            // Wait for language to load before displaying content
            useSuspense: true,
        },
    });

export default i18n;
