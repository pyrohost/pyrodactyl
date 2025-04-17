import { HugeIconProps } from './props';

const HugeIconsHamburger = (props: HugeIconProps) => {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            fill={props.fill}
            viewBox='0 0 24 24'
            strokeWidth='1.5'
            stroke='currentColor'
            className={'h-6 w-6' + (props.className ? ` ${props.className}` : '')}
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                fill={props.fill}
            />
        </svg>
    );
};

export default HugeIconsHamburger;
