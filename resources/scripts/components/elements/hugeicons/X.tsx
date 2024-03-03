import * as React from 'react';
import { HugeIconProps } from './props';

const HugeIconsX = (props: HugeIconProps) => {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill={props.fill}
            className={'h-6 w-6' + (props.className ? ` ${props.className}` : '')}
        >
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M19.8839 4.11612C20.372 4.60427 20.372 5.39573 19.8839 5.88388L5.88388 19.8839C5.39573 20.372 4.60427 20.372 4.11612 19.8839C3.62796 19.3957 3.62796 18.6043 4.11612 18.1161L18.1161 4.11612C18.6043 3.62796 19.3957 3.62796 19.8839 4.11612Z'
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4.11612 4.11612C4.60427 3.62796 5.39573 3.62796 5.88388 4.11612L19.8839 18.1161C20.372 18.6043 20.372 19.3957 19.8839 19.8839C19.3957 20.372 18.6043 20.372 18.1161 19.8839L4.11612 5.88388C3.62796 5.39573 3.62796 4.60427 4.11612 4.11612Z'
            />
        </svg>
    );
};

export default HugeIconsX;
