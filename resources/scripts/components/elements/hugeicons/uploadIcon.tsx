import { HugeIconProps } from './props';

const UploadIcon = (props: HugeIconProps) => {
    return (
        <svg
            className={
                'h-6 w-6 lucide lucide-upload-icon lucide-upload' + (props.className ? ` ${props.className}` : '')
            }
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M12 3v12' />
            <path d='m17 8-5-5-5 5' />
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
        </svg>
    );
};

export default UploadIcon;
