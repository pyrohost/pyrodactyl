import Spinner from '@/components/elements/Spinner';
import styled, { css } from 'styled-components';
import Select from '@/components/elements/Select';
import FadeTransition from './transitions/FadeTransition';

const Container = styled.div<{ visible?: boolean }>`
    position: relative
        ${(props) =>
            props.visible &&
            css`
                & ${Select} {
                    background-image: none;
                }
            `};
`;

const InputSpinner = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
    <Container visible={visible}>
        <FadeTransition
            css={`
                position: relative;
            `}
            show={visible}
            duration='duration-150'
            appear
            unmount
        >
            <div className={`absolute right-0 h-full flex items-center justify-end pr-3`}>
                <Spinner size='small' />
            </div>
        </FadeTransition>
        {children}
    </Container>
);

export default InputSpinner;
