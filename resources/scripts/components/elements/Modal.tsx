import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import FadeTransition from './transitions/FadeTransition';

export interface RequiredModalProps {
    visible: boolean;
    onDismissed: () => void;
    appear?: boolean;
    top?: boolean;
}

export interface ModalProps extends RequiredModalProps {
    dismissable?: boolean;
    closeOnEscape?: boolean;
    closeOnBackground?: boolean;
    showSpinnerOverlay?: boolean;
}

export const ModalMask = styled.div`
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%);
    position: fixed;
    z-index: 9997;
    overflow: auto;
    flex: 1;
    inset: 0;
    backdrop-filter: blur(3px);

`;

// export const ModalMask = styled.div`
//     ${tw`fixed z-[9997] overflow-auto flex w-full inset-0 backdrop-blur-sm`};
//     background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%);
// `;

// const ModalContainer = styled.div<{ alignTop?: boolean }>`
//     max-width: 95%;
//     max-height: calc(100vh - 8rem);

//     ${tw`relative flex flex-col w-full m-auto`};
//     ${(props) =>
//         props.alignTop &&
//         css`
//             margin-top: 20%;
//         `};

//     margin-bottom: auto;

//     & > .close-icon {
//         ${tw`absolute right-0 top-0 p-2 text-white cursor-pointer opacity-50 transition-all duration-150 ease-linear hover:opacity-100`};

//         &:hover {
//             ${tw`transform rotate-90`}
//         }

//         & > svg {
//             ${tw`w-6 h-6`};
//         }
//     }
// `;

const Modal: React.FC<ModalProps> = ({
    visible,
    appear,
    dismissable,
    showSpinnerOverlay,
    top = true,
    closeOnBackground = true,
    closeOnEscape = true,
    onDismissed,
    children,
}) => {
    const [render, setRender] = useState(visible);

    const isDismissable = useMemo(() => {
        return (dismissable || true) && !(showSpinnerOverlay || false);
    }, [dismissable, showSpinnerOverlay]);

    useEffect(() => {
        if (!isDismissable || !closeOnEscape) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setRender(false);
        };

        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [isDismissable, closeOnEscape, render]);

    useEffect(() => setRender(visible), [visible]);

    return (
        <FadeTransition as={Fragment} show={render} duration="duration-150" appear={appear ?? true} unmount>
            <div
                className='fixed z-[9997] overflow-auto flex w-full inset-0 backdrop-blur-sm'
                style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%)',
                }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                    if (isDismissable && closeOnBackground) {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) {
                            setRender(false);
                        }
                    }
                }}
            >
                <div>
                    {isDismissable && (
                        <div className={'close-icon'} onClick={() => setRender(false)}>
                            <svg
                                xmlns={'http://www.w3.org/2000/svg'}
                                fill={'none'}
                                viewBox={'0 0 24 24'}
                                stroke={'currentColor'}
                            >
                                <path
                                    strokeLinecap={'round'}
                                    strokeLinejoin={'round'}
                                    strokeWidth={'2'}
                                    d={'M6 18L18 6M6 6l12 12'}
                                />
                            </svg>
                        </div>
                    )}
                    {showSpinnerOverlay && (
                            <div
                                className={`absolute w-full h-full rounded flex items-center justify-center`}
                                style={{ background: 'hsla(211, 10%, 53%, 0.35)', zIndex: 9999 }}
                            >
                                <Spinner />
                            </div>
                    )}
                    <div
                        style={{
                            background:
                                'linear-gradient(0deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), rgba(255, 255, 255, 0.12)',
                        }}
                        className='p-8 relative border-[1px] border-[#ffffff07] rounded-2xl w-full mx-auto text-left shadow-2xl backdrop-blur-3xl'
                    >
                        {children}
                    </div>
                </div>
            </div>
        </FadeTransition>
    );
};

const PortaledModal: React.FC<ModalProps> = ({ children, ...props }) => {
    const element = useRef(document.getElementById('modal-portal'));

    return createPortal(<Modal {...props}>{children}</Modal>, element.current!);
};

export default PortaledModal;
