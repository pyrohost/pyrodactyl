'use client';

import { Fragment } from 'react';

import MessageBox from '@/components/MessageBox';

import { useStateContext } from '@/state';

const FlashMessageRender = ({}: Readonly<{}>) => {
    const state = useStateContext();

    return state?.flashes.length ? (
        <>
            {state?.flashes.map((flash, index) => (
                <Fragment key={flash.id || flash.type + flash.message}>
                    {index > 0 && <div></div>}
                    <MessageBox type={flash.type} title={flash.title}>
                        {flash.message}
                    </MessageBox>
                </Fragment>
            ))}
        </>
    ) : null;
};

export default FlashMessageRender;
