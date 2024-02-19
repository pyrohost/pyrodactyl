import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full bg-zinc-700 shadow overflow-x-auto`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-block py-3 px-4 text-zinc-300 no-underline whitespace-nowrap transition-all duration-150`};

            &:not(:first-of-type) {
                ${tw`ml-2`};
            }

            &:hover {
                ${tw`text-zinc-100`};
            }

            &:active,
            &.active {
                ${tw`text-zinc-100`};
                box-shadow: inset 0 -2px;
            }
        }
    }
`;

export default SubNavigation;
