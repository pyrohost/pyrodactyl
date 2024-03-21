import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
    * {
        min-width: 0
    }

    html, body, #app {
        position: relative;
        height: 100%;
        width: 100%;
        overflow: hidden;
        --tw-bg-opacity: 1;
        background-color: rgb(0 0 0 / var(--tw-bg-opacity));
        font-family: "Plus Jakarta Sans", sans-serif;
        --tw-text-opacity: 1;
        color: rgb(255 255 255 / var(--tw-text-opacity));
    }

    form {
        margin: 0;
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        outline: none;
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scroll Bar Style */
    ::-webkit-scrollbar {
        background: none;
        width: 12px;
        height: 16px;
    }

    ::-webkit-scrollbar-thumb {
        border: solid 0 rgb(0 0 0 / 0%);
        border-right-width: 3px;
        border-left-width: 3px;
        -webkit-border-radius: 9px 4px;
        -webkit-box-shadow: inset 0 0 0 3px hsl(0deg 0% 30%);
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-thumb:horizontal {
        border-right-width: 0;
        border-left-width: 0;
        border-top-width: 4px;
        border-bottom-width: 4px;
        -webkit-border-radius: 4px 9px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }

    @keyframes list-anim {
        0% {
            transform: translateY(-22px) scale(0.98);
            opacity: 0;
        }

        100% {
            transform: none;
            opacity: 1;
        }
    }

    .skeleton-anim-2 {
        animation: list-anim 1.5s both;
        will-change: transform;
    }
`;
