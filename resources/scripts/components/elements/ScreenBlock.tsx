import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/**
 * Component hiển thị màn hình đầy đủ với thông báo
 * @param title Tiêu đề màn hình (có thể là key i18n)
 * @param message Thông điệp hiển thị (có thể là key i18n)
 */
const ScreenBlock = ({ title, message }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>
                        {title.startsWith('errors.') ? t(title) : title}
                    </h1>
                    <p className=''>{message.startsWith('errors.') ? t(message) : message}</p>
                </div>
            </div>
        </>
    );
};

/**
 * Component hiển thị lỗi máy chủ
 * @param title Tiêu đề lỗi (có thể là key i18n)
 * @param message Thông điệp lỗi (có thể là key i18n)
 */
const ServerError = ({ title, message }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>
                        {title.startsWith('errors.') ? t(title) : title}
                    </h1>
                    <p className=''>{message.startsWith('errors.') ? t(message) : message}</p>
                </div>
            </div>
        </>
    );
};

const NotFound = () => {
    const { t } = useTranslation();

    return (
        <>
            <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
                <div className='flex flex-col gap-8 max-w-sm text-left'>
                    <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>
                        {t('errors.page_not_found_title')}
                    </h1>
                    <p className=''>{t('errors.page_not_found_message')}</p>
                    <div className='flex flex-col gap-2'>
                        <Link to={'/'} className='text-brand'>
                            {t('server_titles.your_servers')}
                        </Link>
                    </div>
                </div>
                <img
                    alt=''
                    className='w-64 rounded-2xl'
                    height='256'
                    src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif'
                    width='256'
                    loading='lazy'
                    decoding='async'
                />
            </div>
        </>
    );
};

export { ServerError, NotFound };
export default ScreenBlock;
