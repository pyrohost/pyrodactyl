import * as React from 'react';
import { HugeIconProps } from './props';

const HugeIconsMoveTo = (props: HugeIconProps) => {
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
                d='M8 5C8 4.44772 8.44772 4 9 4L19 4C19.5523 4 20 4.44772 20 5C20 5.55229 19.5523 6 19 6L9 6C8.44772 6 8 5.55228 8 5Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4 5C4 4.44772 4.44571 4 4.99553 4H5.00447C5.55429 4 6 4.44772 6 5C6 5.55228 5.55429 6 5.00447 6H4.99553C4.44571 6 4 5.55228 4 5Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4 11C4 10.4477 4.44571 10 4.99553 10H5.00447C5.55429 10 6 10.4477 6 11C6 11.5523 5.55429 12 5.00447 12H4.99553C4.44571 12 4 11.5523 4 11Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M4 17C4 16.4477 4.44571 16 4.99553 16H5.00447C5.55429 16 6 16.4477 6 17C6 17.5523 5.55429 18 5.00447 18H4.99553C4.44571 18 4 17.5523 4 17Z'
                fill={props.fill}
            />
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M8 11C8 10.4477 8.44772 10 9 10L19 10C19.5523 10 20 10.4477 20 11C20 11.5523 19.5523 12 19 12L9 12C8.44772 12 8 11.5523 8 11Z'
                fill={props.fill}
            />
            <path
                d='M16.2394 14.3508C16.5979 13.9307 17.2291 13.8809 17.6492 14.2394L18.8592 15.2721C19.1015 15.4788 19.3543 15.6945 19.5385 15.9005C19.7451 16.1317 20 16.4948 20 17C20 17.5052 19.7451 17.8683 19.5385 18.0995C19.3543 18.3056 19.1015 18.5212 18.8592 18.7279L17.6492 19.7606C17.2291 20.1192 16.5979 20.0693 16.2394 19.6492C16.0785 19.4608 15.9999 19.2298 16 19V18.6C16 18.3172 16 18.1758 15.9121 18.0879C15.8243 18 15.6828 18 15.4 18L9 18C8.44772 18 8 17.5523 8 17C8 16.4477 8.44772 16 9 16L15.4 16C15.6828 16 15.8243 16 15.9121 15.9122C16 15.8243 16 15.6829 16 15.4V14.9933C16.0014 14.7657 16.0801 14.5374 16.2394 14.3508Z'
                fill={props.fill}
            />
        </svg>
    );
};

export default HugeIconsMoveTo;
