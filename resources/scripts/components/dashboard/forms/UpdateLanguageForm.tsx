import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Button } from '@/components/elements/button/index';

/**
 * Các ngôn ngữ được hỗ trợ trong hệ thống
 */
const SUPPORTED_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
];

/**
 * Component form cho phép người dùng thay đổi ngôn ngữ hiển thị của hệ thống
 */
const UpdateLanguageForm = () => {
    const { t, i18n } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tìm ngôn ngữ hiện tại để hiển thị trong dropdown
    const currentLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.value === i18n.language) || SUPPORTED_LANGUAGES[0];

    /**
     * Xử lý khi người dùng thay đổi ngôn ngữ
     * @param value - Giá trị ngôn ngữ được chọn
     */
    const handleLanguageChange = (value: string) => {
        i18n.changeLanguage(value);
    };

    /**
     * Xử lý khi người dùng lưu thay đổi ngôn ngữ
     */
    const handleSubmit = () => {
        //TODO: Lưu thay đổi ngôn ngữ
        setIsSubmitting(true);
        // Giả lập việc lưu thay đổi (sẽ được thay thế bằng API thực tế sau)
        setTimeout(() => {
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className='mb-6'>
            <p className='text-sm text-gray-400 mb-4'>{t('language.choose_language')}</p>
            <DropdownMenu>
                <DropdownMenuTrigger className='w-full bg-[#ffffff17] sm:w-auto flex items-center gap-2 text-white rounded-md p-2'>
                    <p className='text-sm'>{currentLanguage?.label || 'English'}</p>
                    <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 13 13' fill='none'>
                        <path
                            fillRule='evenodd'
                            clipRule='evenodd'
                            d='M3.39257 5.3429C3.48398 5.25161 3.60788 5.20033 3.73707 5.20033C3.86626 5.20033 3.99016 5.25161 4.08157 5.3429L6.49957 7.7609L8.91757 5.3429C8.9622 5.29501 9.01602 5.25659 9.07582 5.22995C9.13562 5.2033 9.20017 5.18897 9.26563 5.18782C9.33109 5.18667 9.39611 5.19871 9.45681 5.22322C9.51751 5.24774 9.57265 5.28424 9.61895 5.33053C9.66524 5.37682 9.70173 5.43196 9.72625 5.49267C9.75077 5.55337 9.76281 5.61839 9.76166 5.68384C9.7605 5.7493 9.74617 5.81385 9.71953 5.87365C9.69288 5.93345 9.65447 5.98727 9.60657 6.0319L6.84407 8.7944C6.75266 8.8857 6.62876 8.93698 6.49957 8.93698C6.37038 8.93698 6.24648 8.8857 6.15507 8.7944L3.39257 6.0319C3.30128 5.9405 3.25 5.81659 3.25 5.6874C3.25 5.55822 3.30128 5.43431 3.39257 5.3429Z'
                            fill='white'
                            fillOpacity='0.37'
                        />
                    </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {SUPPORTED_LANGUAGES.map((language) => (
                        <DropdownMenuItem key={language.value} onClick={() => handleLanguageChange(language.value)}>
                            {language.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className='flex justify-end mt-4'>
                <Button className='w-full sm:w-auto' disabled={isSubmitting} onClick={handleSubmit}>
                    {t('common.save_changes')}
                </Button>
            </div>
        </div>
    );
};

export default UpdateLanguageForm;
