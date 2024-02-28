import styled from 'styled-components';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    ${tw`flex flex-col flex-1 h-fit min-h-full relative px-14 w-full`};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
