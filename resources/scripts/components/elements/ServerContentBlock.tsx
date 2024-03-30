import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';

import { ServerContext } from '@/state/server';

interface Props extends PageContentBlockProps {
    title: string;
}

const ServerContentBlock: React.FC<Props> = ({ title, children, ...props }) => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);

    return (
        <PageContentBlock title={`${title} - ${name}`} {...props}>
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
