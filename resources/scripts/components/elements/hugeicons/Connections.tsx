import React from 'react';
import { HugeIconProps } from './props';

const HugeIconsConnections = (props: HugeIconProps) => {
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
                d='M18.5 5.5L9.5 5.5C8.94772 5.5 8.5 5.05228 8.5 4.5C8.5 3.94772 8.94772 3.5 9.5 3.5L18.5 3.5C19.0523 3.5 19.5 3.94772 19.5 4.5C19.5 5.05229 19.0523 5.5 18.5 5.5Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M7.79289 7.79289C8.18342 7.40237 8.81658 7.40237 9.20711 7.79289L15.7071 14.2929C16.0976 14.6834 16.0976 15.3166 15.7071 15.7071C15.3166 16.0976 14.6834 16.0976 14.2929 15.7071L7.79289 9.20711C7.40237 8.81658 7.40237 8.18342 7.79289 7.79289Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4.5 7.5C5.05228 7.5 5.5 7.94772 5.5 8.5L5.5 19.5C5.5 20.0523 5.05228 20.5 4.5 20.5C3.94771 20.5 3.5 20.0523 3.5 19.5L3.5 8.5C3.5 7.94772 3.94772 7.5 4.5 7.5Z'
                fill={props.fill}
            />
            <circle cx='5.94444' cy='5.94444' r='4.44444' fill={props.fill} />
            <path
                d='M7 20C7 21.3807 5.88071 22.5 4.5 22.5C3.11929 22.5 2 21.3807 2 20C2 18.6193 3.11929 17.5 4.5 17.5C5.88071 17.5 7 18.6193 7 20Z'
                fill={props.fill}
            />
            <circle cx='16' cy='16' r='2.5' fill={props.fill} />
            <path
                d='M22.5 4.5C22.5 5.88071 21.3807 7 20 7C18.6193 7 17.5 5.88071 17.5 4.5C17.5 3.11929 18.6193 2 20 2C21.3807 2 22.5 3.11929 22.5 4.5Z'
                fill={props.fill}
            />
        </svg>
    );
};

export default HugeIconsConnections;
