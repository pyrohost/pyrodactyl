/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dialog as HDialog } from '@headlessui/react';
// FIXME: add icons back
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import Spinner from '@/components/elements/Spinner';
import { DialogContext, IconPosition, styles } from '@/components/elements/dialog';

import HugeIconsX from './hugeicons/X';

const variants = {
    open: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            damping: 20,
            stiffness: 300,
            duration: 0.15,
        },
    },
    closed: {
        scale: 0.75,
        opacity: 0,
        transition: {
            type: 'easeIn',
            duration: 0.15,
        },
    },
    bounce: {
        scale: 0.95,
        opacity: 1,
        transition: { type: 'linear', duration: 0.075 },
    },
};

export interface RequiredModalProps {
    visible: boolean;
    onDismissed: () => void;
    appear?: boolean;
    top?: boolean;
    children?: React.ReactNode;
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

const Modal: React.FC<ModalProps> = ({ visible, dismissable = true, showSpinnerOverlay, onDismissed, children }) => {
    const isDismissable = useMemo(() => {
        return (dismissable || true) && !(showSpinnerOverlay || false);
    }, [dismissable, showSpinnerOverlay]);

    const container = useRef<HTMLDivElement>(null);
    const [icon, setIcon] = useState<React.ReactNode>();
    const [_, setFooter] = useState<React.ReactNode>();
    const [iconPosition, setIconPosition] = useState<IconPosition>('title');
    const [down, setDown] = useState(false);

    const onContainerClick = (down: boolean, e: React.MouseEvent<HTMLDivElement>): void => {
        if (e.target instanceof HTMLElement && container.current?.isSameNode(e.target)) {
            setDown(down);
        }
    };

    const onDialogClose = (): void => {
        if (isDismissable) {
            return onDismissed();
        }
    };

    return (
        <>
            {showSpinnerOverlay && (
                <div
                    className={`fixed inset-0 w-full h-full rounded flex items-center justify-center`}
                    style={{ background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
                >
                    <Spinner />
                </div>
            )}
            <AnimatePresence>
                {visible && (
                    <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition }}>
                        <HDialog
                            static
                            as={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            open={visible}
                            onClose={onDialogClose}
                        >
                            <div
                                style={{
                                    background:
                                        'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%)',
                                }}
                                className={'fixed inset-0 backdrop-blur-sm z-[9997]'}
                            />
                            <div className={'fixed inset-0 overflow-y-auto z-[9998]'}>
                                <div
                                    ref={container}
                                    className={styles.container}
                                    onMouseDown={onContainerClick.bind(this, true)}
                                    onMouseUp={onContainerClick.bind(this, false)}
                                >
                                    <HDialog.Panel
                                        as={motion.div}
                                        initial={'closed'}
                                        animate={down ? 'bounce' : 'open'}
                                        exit={'closed'}
                                        variants={variants}
                                        className={styles.panel}
                                    >
                                        <div className={'flex p-6 pb-0 overflow-y-auto'}>
                                            {iconPosition === 'container' && icon}
                                            <div className={'flex-1 max-h-[70vh] min-w-0'}>
                                                <div className={'flex items-center'}>
                                                    {iconPosition !== 'container' && icon}
                                                    {children}
                                                    <div className={'invisible h-6'} />
                                                </div>
                                            </div>
                                        </div>

                                        {dismissable && (
                                            <div
                                                className={
                                                    'absolute right-0 top-0 m-4 p-2 opacity-45 hover:opacity-100'
                                                }
                                            >
                                                <button onClick={onDismissed}>
                                                    <HugeIconsX fill='currentColor' />
                                                </button>
                                            </div>
                                        )}
                                    </HDialog.Panel>
                                </div>
                            </div>{' '}
                        </HDialog>
                    </DialogContext.Provider>
                )}
            </AnimatePresence>
        </>
    );
};

export default Modal;
