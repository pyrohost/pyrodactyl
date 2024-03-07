
import styled from 'styled-components';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: string;
    type?: FlashMessageType;
}

const Container = styled.div<{ $type?: FlashMessageType }>`

`;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container $type={type} role={'alert'}>
        {title && (
            <span
                className={'title'}
                css={[

                ]}
            >
                {title}
            </span>
        )}
        <span>{children}</span>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
