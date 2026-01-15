import * as React from 'react';
import styled from 'styled-components';

interface CheckboxProps {
    label?: string;
    checked: boolean;
    onChange: () => void;
}

const CheckboxWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
`;

const StyledInput = styled.input`
    margin-right: 8px;
`;

const StyledLabel = styled.label`
    display: flex;
    align-items: center;
    cursor: pointer;
`;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ label, checked, onChange }, ref) => {
    return (
        <CheckboxWrapper>
            {label && (
                <StyledLabel>
                    <StyledInput type='checkbox' checked={checked} onChange={onChange} ref={ref} />
                    <span>{label}</span>
                </StyledLabel>
            )}
        </CheckboxWrapper>
    );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
