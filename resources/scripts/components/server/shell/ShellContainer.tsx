import FlashMessageRender from '@/components/FlashMessageRender';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

import { ServerContext } from '@/state/server';
import 

export default () => {
    const egg = ServerContext.useStoreState((state) => state.server.data!.egg);
    return (
        <ServerContentBlock title={'Shell'}>
            <FlashMessageRender byKey={'Shell'} />
            <MainPageHeader title={'Shell'} />
            <div className='w-full h-full flex flex-col gap-8'>
                Current Egg: {egg}
            </div>
        </ServerContentBlock>
    );
};
