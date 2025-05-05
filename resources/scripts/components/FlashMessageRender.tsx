import { useStoreState } from 'easy-peasy';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import MessageBox from '@/components/MessageBox';

type Props = Readonly<{
    byKey?: string;
}>;

/**
 * Component hiển thị các flash message từ store
 * @param byKey Lọc message theo key
 */
const FlashMessageRender = ({ byKey }: Props) => {
    const { t } = useTranslation();
    const flashes = useStoreState((state) =>
        state.flashes.items.filter((flash) => (byKey ? flash.key === byKey : true)),
    );

    return flashes.length ? (
        <>
            {flashes.map((flash, index) => (
                <Fragment key={flash.id || flash.type + flash.message}>
                    {index > 0 && <div></div>}
                    <MessageBox type={flash.type} title={flash.title}>
                        {flash.message?.startsWith('common.') || flash.message?.startsWith('error.')
                            ? t(flash.message)
                            : flash.message}
                    </MessageBox>
                </Fragment>
            ))}
        </>
    ) : null;
};

export default FlashMessageRender;
