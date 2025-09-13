import { HugeIconProps } from './props';

const HugeIconsMoreHorizontal = (props: HugeIconProps) => {
    return (
        <svg
            className={'h-6 w-6' + (props.className ? ` ${props.className}` : '')}
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
        >
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M10.2459 12C10.2459 11.0335 11.0294 10.25 11.9959 10.25H12.0049C12.9714 10.25 13.7549 11.0335 13.7549 12C13.7549 12.9665 12.9714 13.75 12.0049 13.75H11.9959C11.0294 13.75 10.2459 12.9665 10.2459 12Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M16.2498 12C16.2498 11.0335 17.0333 10.25 17.9998 10.25H18.0088C18.9753 10.25 19.7588 11.0335 19.7588 12C19.7588 12.9665 18.9753 13.75 18.0088 13.75H17.9998C17.0333 13.75 16.2498 12.9665 16.2498 12Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4.2498 12C4.2498 11.0335 5.0333 10.25 5.9998 10.25H6.00878C6.97528 10.25 7.75878 11.0335 7.75878 12C7.75878 12.9665 6.97528 13.75 6.00878 13.75H5.9998C5.0333 13.75 4.2498 12.9665 4.2498 12Z'
                fill={props.fill}
            />
        </svg>
    );
};

export default HugeIconsMoreHorizontal;
