import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Khởi tạo cấu hình i18n cho ứng dụng
 * - Sử dụng Backend để tải file ngôn ngữ từ thư mục public/locales
 * - Sử dụng LanguageDetector để tự động phát hiện ngôn ngữ từ trình duyệt
 * - Khởi tạo với ngôn ngữ mặc định là tiếng Anh
 */
i18n
    // Tải ngôn ngữ từ thư mục public/locales/{lng}/translation.json
    .use(Backend)
    // Phát hiện ngôn ngữ tự động từ trình duyệt
    .use(LanguageDetector)
    // Tích hợp với react-i18next
    .use(initReactI18next)
    // Khởi tạo i18next
    .init({
        // Ngôn ngữ mặc định
        fallbackLng: 'en',
        // Ngôn ngữ được hỗ trợ
        supportedLngs: ['en', 'vi'],
        // Không sử dụng dấu chấm để phân tách khóa
        debug: false,
        // Cấu hình tải các namespace
        ns: ['translation'],
        defaultNS: 'translation',
        // Cấu hình backend
        backend: {
            // Đường dẫn tới file ngôn ngữ
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        // Cấu hình phát hiện ngôn ngữ
        detection: {
            // Thứ tự phát hiện ngôn ngữ: localStorage, cookie, navigator
            order: ['localStorage', 'cookie', 'navigator'],
            // Lưu ngôn ngữ vào localStorage và cookie
            caches: ['localStorage', 'cookie'],
        },
        // Cấu hình nội suy
        interpolation: {
            // React đã xử lý XSS nên không cần escape giá trị
            escapeValue: false,
        },
        // Cấu hình cho react-i18next
        react: {
            // Đợi tải ngôn ngữ xong mới hiển thị nội dung
            useSuspense: true,
        },
    });

export default i18n;
