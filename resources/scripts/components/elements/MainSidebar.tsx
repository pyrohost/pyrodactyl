import styled from 'styled-components';

const MainSidebar = styled.nav`
    width: 300px;
    flex-direction: column;
    flex-shrink: 0;
    border-radius: 8px;
    overflow-x: hidden;
    padding: 32px;
    position: relative;
    margin-right: 8px;
    user-select: none;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);

    & > .pyro-subnav-routes-wrapper {
        display: flex;
        flex-direction: column;
        font-size: 14px;

        & > a,
        & > div {
            display: flex;
            position: relative;
            padding: 16px 0;
            gap: 8px;
            font-weight: 600;
            min-height: 56px;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            user-drag: none;
            -ms-user-drag: none;
            -moz-user-drag: none;
            -webkit-user-drag: none;
            transition: 80ms all ease-in-out;

            &.active {
                color: #fa4e49;
                fill: #fa4e49;
            }
        }
    }
`;

export default MainSidebar;
