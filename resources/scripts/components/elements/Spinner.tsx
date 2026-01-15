import { Suspense } from 'react';
import styled, { css, keyframes } from 'styled-components';

import ErrorBoundary from '@/components/elements/ErrorBoundary';

export type SpinnerSize = 'small' | 'base' | 'large';

interface Props {
    size?: SpinnerSize;
    visible?: boolean;
    centered?: boolean;
    isBlue?: boolean;
    children?: React.ReactNode;
}

interface Spinner extends React.FC<Props> {
    Size: Record<'SMALL' | 'BASE' | 'LARGE', SpinnerSize>;
    Suspense: React.FC<{ children: React.ReactNode }>; // ✅ Correct
}

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

const SpinnerComponent = styled.div<Props>`
    width: 32px;
    height: 32px;
    border-width: 3px;
    border-radius: 50%;
    animation: ${spin} 1s cubic-bezier(0.55, 0.25, 0.25, 0.7) infinite;
    aspect-ratio: 1 / 1;

    ${(props) =>
        props.size === 'small'
            ? `width: 16px; height: 16px; border-width: 2px;`
            : props.size === 'large'
              ? css`
                    width: 64px;
                    height: 64px;
                    border-width: 6px;
                `
              : null};

    border-color: ${(props) => (!props.isBlue ? 'rgba(255, 255, 255, 0.2)' : 'hsla(212, 92%, 43%, 0.2)')};
    border-top-color: ${(props) => (!props.isBlue ? 'rgb(255, 255, 255)' : 'hsl(212, 92%, 43%)')};
`;

const Spinner: Spinner = ({ centered, visible = true, ...props }) =>
    visible &&
    (centered ? (
        <div
            className={`
              flex justify-center items-center w-full
              sm:absolute sm:inset-0 sm:z-50
          `}
        >
            <SpinnerComponent {...props} />
        </div>
    ) : (
        <SpinnerComponent {...props} />
    ));

Spinner.displayName = 'Spinner';

Spinner.Size = {
    SMALL: 'small',
    BASE: 'base',
    LARGE: 'large',
};

Spinner.Suspense = ({ children }) => (
    <Suspense fallback={<Spinner centered size={Spinner.Size.LARGE} />}>
        <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
);
Spinner.Suspense.displayName = 'Spinner.Suspense';

export default Spinner;
