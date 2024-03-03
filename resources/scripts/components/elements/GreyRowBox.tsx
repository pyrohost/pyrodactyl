import styled from 'styled-components';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded-xl no-underline items-center bg-[#111111] border-[#ffffff06] p-4 border-2 transition-colors duration-150 overflow-hidden`};

    ${(props) => props.$hoverable !== false && tw`hover:border-[#ffffff12]`};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center bg-zinc-500 p-3`};
    }
`;
