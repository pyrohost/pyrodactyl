import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-gray-200 items-center bg-gray-700 p-4 border border-transparent transition-colors duration-150 overflow-hidden`};

    ${(props) => props.$hoverable !== false && tw`hover:border-gray-500`};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center bg-gray-500 p-3`};
    }
`;
