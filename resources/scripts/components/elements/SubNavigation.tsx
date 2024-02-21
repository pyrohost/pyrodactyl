import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.nav`
    ${tw`w-[300px] flex flex-col flex-shrink-0 rounded-md overflow-x-hidden p-8`};
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);

    & > .pyro-subnav-routes-wrapper {
        ${tw`flex flex-col text-sm`};

        & > a,
        & > div {
            ${tw`flex py-4 whitespace-nowrap font-bold text-sm`};

            &:hover {
                ${tw`text-zinc-100`};
            }

            &:active,
            &.active {
                // ${tw`text-zinc-100`};
                // box-shadow: inset 0 -2px;
            }
        }
    }
`;

export default SubNavigation;
