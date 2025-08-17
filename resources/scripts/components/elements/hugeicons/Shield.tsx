import { HugeIconProps } from './props';

const HugeIconsShield = (props: HugeIconProps) => {
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
                d='M14.1699 22.1006C16.8466 20.7234 21.7499 17.3739 21.75 11.2373V7.74805C21.75 6.40064 21.7719 5.46059 21.1885 4.51855C20.6144 3.59166 19.9634 3.2822 19.043 2.82422C17.04 1.82765 14.6089 1.25 12 1.25C9.39104 1.25 6.95999 1.82764 4.95702 2.82422C4.03654 3.2822 3.38562 3.59166 2.81151 4.51855C2.22802 5.46059 2.24998 6.40064 2.24999 7.74805V11.2373C2.25012 17.3739 7.15334 20.7234 9.83006 22.1006L9.86676 22.1195C10.5845 22.4889 11.0919 22.75 12 22.75C12.9081 22.75 13.4154 22.4889 14.1332 22.1195L14.1699 22.1006Z'
                fill={props.fill || 'currentColor'}
            />
        </svg>
    );
};

export default HugeIconsShield;
