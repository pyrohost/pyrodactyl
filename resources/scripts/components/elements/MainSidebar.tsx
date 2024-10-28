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
    background: rgba(0, 0, 0, 0.06); /* Dark background for black-and-white theme */
    border: 1px solid rgba(255, 255, 255, 0.08);

    & > .pyro-subnav-routes-wrapper {
        display: flex;
        flex-direction: column;
        font-size: 14px;
        color: white; /* Text color for links */

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
            transition: 200ms all ease-in-out;
            color: #ccc; /* Default link color in black-and-white */
            background: transparent; /* Transparent background for links */

            &.active {
                color: #fa4e49; /* Highlight color for active link */
                fill: #fa4e49; /* Ensure active fill color is set if using SVG icons */
            }

            &:hover {
                color: #fff; /* Change color on hover for better visibility */
            }
        }
    }
`;

export default MainSidebar;
