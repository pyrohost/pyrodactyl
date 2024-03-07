import styled from 'styled-components';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const Container = styled.div<{ $type?: FlashMessageType }>``;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container className='flex items-center gap-2 bg-[#ffffff11] px-4 py-2 rounded-full' $type={type} role={'alert'}>
        {title && <h2 className='uppercase text-xs font-bold'>{title}</h2>}
        <p>{children}</p>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
