import styled from 'styled-components';

import Code from './elements/Code';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const Container = styled.div<{ $type?: FlashMessageType }>``;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container
        className='flex flex-col gap-2 bg-black border-[2px] border-brand/70 p-4 rounded-2xl mb-4'
        $type={type}
        role={'alert'}
    >
        {title && <h2 className='font-bold text-xl'>{title}</h2>}
        <Code>{children}</Code>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
