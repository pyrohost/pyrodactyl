import { HugeIconProps } from './props';

const HugeIconsDotFilled = (props: HugeIconProps) => {
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
                d='M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12Z'
                fill={props.fill || 'currentColor'}
            />
        </svg>
    );
};

export default HugeIconsDotFilled;
