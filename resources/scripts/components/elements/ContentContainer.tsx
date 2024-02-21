import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    ${tw`flex flex-col flex-1 relative px-12 w-full h-full`};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
