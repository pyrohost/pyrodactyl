import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
    // * {
    //     min-width: 0
    // }

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

    button {
        user-select: none;
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
        width: 10px;
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

    [cmdk-dialog] {
        position: fixed;
        width: 100%;
        height: 100%;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        -webkit-box-pack: center;
        justify-content: center;
        padding: calc(13vh - -0.19px) 16px 16px;
        background: #00000055;
    }

    [cmdk-root] {
        max-width: 640px;
        width: 100%;
        border-radius: 16px;
        overflow: hidden;
        padding: 0;
        outline: none;
        background: radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgba(46, 46, 46, 0.3) 0%, rgb(26, 26, 26, 0.2) 100%);
        backdrop-filter: blur(20px);
        box-shadow: rgba(0, 0, 0, 0.5) 0px 16px 70px;
        position: relative;
        display: flex;
        flex-direction: column;
        flex-shrink: 1;
        -webkit-box-flex: 1;
        flex-grow: 1;
        min-width: min-content;
        will-change: transform;
        transform-origin: center center;
    }

    [cmdk-input] {
        border: none;
        width: 100%;
        font-size: 18px;
        font-weight: bold;
        padding: 20px;
        outline: none;
        background: transparent;
        border-bottom: 1px solid #3a3a3a44;
        color: #eee;
        border-radius: 0;
        caret-color: #fa4e49;
        margin: 0;

        &::placeholder {
            color: #444;
        }
    }

    [cmdk-item] {
        content-visibility: auto;
        font-weight: bold;
        cursor: pointer;
        height: 48px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        border-radius: 12px;
        user-select: none;
        will-change: background, color;
        transition: all 150ms ease;
        transition-property: none;
        position: relative;
        margin-left: 8px;
        margin-right: 8px;

        &[data-selected='true'] {
            background: #3a3a3add;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;

            svg {
                color: #fff;
            }

            /* &:after {
                content: '';
                position: absolute;
                left: 0;
                z-index: 123;
                width: 3px;
                height: 100%;
                background: #fa4e49;
            } */
        }

        &[data-disabled='true'] {
            color: #444;
            cursor: not-allowed;
        }

        &[data-disabled='true'] svg {
            color: #444;
        }

        &:active {
            transition-property: background;
            background: #3a3a3add;
        }

        svg {
            width: 16px;
            height: 16px;
            color: #ddd;
        }
    }

    [cmdk-list] {
        height: min(300px, var(--cmdk-list-height));
        max-height: 400px;
        overflow: auto;
        overscroll-behavior: contain;
        transition: 100ms ease;
        transition-property: height;
    }

    [cmdk-list] {
        scroll-padding-block-start: 8px;
        scroll-padding-block-end: 8px;
    }

    [cmdk-group-heading] {
        user-select: none;
        font-size: 12px;
        color: var(--gray11);
        padding: 0 16px;
        margin-top: 8px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
    }

    [cmdk-empty] {
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 64px;
        white-space: pre-wrap;
        color: var(--gray11);
    }

    input::placeholder {
        color: #ffffff55 !important;
    }
`;
