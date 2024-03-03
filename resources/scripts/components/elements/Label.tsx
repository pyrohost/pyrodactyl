import styled from 'styled-components';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`block text-sm text-zinc-200 mb-1 sm:mb-2`};
    ${(props) => props.isLight && tw`text-zinc-700`};
`;

export default Label;
