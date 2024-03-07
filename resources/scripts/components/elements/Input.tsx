import styled, { css } from 'styled-components';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const checkboxStyle = css<Props>`
    color-adjust: exact;
    background-origin: border-box;
    transition: all 75ms linear, box-shadow 25ms linear;

    &:checked {

        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: white;
        background-size: 100% 100%;
    }

    &:focus {

        box-shadow: 0 0 0 1px rgba(9, 103, 210, 0.25);
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
