import styled, { css } from 'styled-components';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const checkboxStyle = css<Props>`
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    background-color: rgba(255, 255, 255, 0.09);
    color-adjust: exact;
    background-origin: border-box;
    transition:
        all 75ms linear,
        box-shadow 25ms linear;

    &:checked {
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: #3b82f6;
        border-color: #3b82f6;
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
    }

    &:hover {
        border-color: rgba(255, 255, 255, 0.3);
    }

    &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
        border-color: #3b82f6;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const inputStyle = css<Props>`
    // Reset to normal styling.
    resize: none;

    & + .input-help {
    }

    &:required,
    &:invalid {
    }

    &:not(:disabled):not(:read-only):focus {
    }

    &:disabled {
    }

    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 0.5rem;
    outline: none;
    background-color: rgba(255, 255, 255, 0.09); /* Converted the hex color with alpha to rgba */
    font-size: 0.875rem; /* 14px */
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
