import Spinner from '@/components/elements/Spinner';
import styled, { css } from 'styled-components';
import Select from '@/components/elements/Select';

const Container = styled.div<{ $visible?: boolean }>`
    position: relative
        ${(props) =>
            props.$visible &&
            css`
                & ${Select} {
                    background-image: none;
                }
            `};
`;

const InputSpinner = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
    <Container $visible={visible}>
        <div className={`absolute right-0 h-full flex items-center justify-end pr-3`}>
            <Spinner size={'small'} />
        </div>
        {children}
    </Container>
);

export default InputSpinner;
