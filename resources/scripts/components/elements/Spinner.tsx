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
    fallback?: React.ReactNode;
}

interface Spinner extends React.FC<Props> {
    Size: Record<'SMALL' | 'BASE' | 'LARGE', SpinnerSize>;
    Suspense: React.FC<Props>;
}

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

// noinspection CssOverwrittenProperties
const SpinnerComponent = styled.div<Props>`
    width: 32px;
    height: 32px;
    border-width: 3px;
    border-radius: 50%;
    animation: ${spin} 1s cubic-bezier(0.55, 0.25, 0.25, 0.7) infinite;

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

/**
 * Component hiển thị hiệu ứng spinner loading
 * @param centered Hiển thị chính giữa container
 * @param visible Điều khiển hiển thị
 * @param props Props khác
 */
const Spinner: Spinner = ({ centered, visible = true, ...props }) =>
    visible &&
    (centered ? (
        <div className={`flex justify-center items-center`}>
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

/**
 * Component Suspense kết hợp với Spinner
 * @param children Nội dung bên trong
 * @param centered Hiển thị spinner chính giữa
 * @param size Kích thước spinner
 * @param fallback Component hiển thị khi đang loading (mặc định là Spinner)
 * @param props Props khác
 */
Spinner.Suspense = ({ children, centered = true, size = Spinner.Size.LARGE, fallback = null, ...props }) => (
    <Suspense fallback={fallback ?? <Spinner centered={centered} size={size} {...props} />}>
        <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
);
Spinner.Suspense.displayName = 'Spinner.Suspense';

export default Spinner;
