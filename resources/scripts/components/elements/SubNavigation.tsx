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
            ${tw`relative flex py-4 gap-2 whitespace-nowrap font-bold text-sm`};

            &.active {
                ${tw`text-brand fill-brand`};
            }

            &:before {
                content: '';
                position: absolute;
                left: -32px;
                height: 0px;
                width: 0px;
                // background: linear-gradient(0deg, rgba(243, 180, 166, 0.06), rgba(243, 180, 166, 0.06)),
                //     radial-gradient(109.26% 109.26% at 49.83% 13.37%, #ff343c 0%, #f06f53 100%);
                // border-radius: 8px;
                transition: 80ms all ease-in-out;
            }

            &:hover:before {
                content: '';
                position: absolute;
                left: -32px;
                height: calc(100% - 36px);
                width: 2px;
                background: white;
                border-radius: 8px;
            }

            &.active:before {
                content: '';
                position: absolute;
                left: -32px;
                height: calc(100% - 16px);
                width: 3px;
                background: linear-gradient(0deg, rgba(243, 180, 166, 0.06), rgba(243, 180, 166, 0.06)),
                    radial-gradient(109.26% 109.26% at 49.83% 13.37%, #ff343c 0%, #f06f53 100%);
                border-radius: 8px;
            }
        }
    }
`;

export default SubNavigation;
