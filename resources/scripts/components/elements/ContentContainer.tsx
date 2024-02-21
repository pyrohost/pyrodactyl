import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    ${tw`flex relative px-12 w-full h-full`};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
