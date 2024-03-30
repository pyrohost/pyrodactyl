import { useStoreState } from 'easy-peasy';
import { Fragment } from 'react';

import MessageBox from '@/components/MessageBox';

type Props = Readonly<{
    byKey?: string;
}>;

const FlashMessageRender = ({ byKey }: Props) => {
    const flashes = useStoreState((state) =>
        state.flashes.items.filter((flash) => (byKey ? flash.key === byKey : true)),
    );

    return flashes.length ? (
        <>
            {flashes.map((flash, index) => (
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
