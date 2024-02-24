import React, { useEffect, useState } from 'react';
import Fade from '@/components/elements/Fade';
import Portal from '@/components/elements/Portal';
import copy from 'copy-to-clipboard';
import classNames from 'classnames';

interface CopyOnClickProps {
    text: string | number | null | undefined;
    showInNotification?: boolean;
    children: React.ReactNode;
}

const CopyOnClick = ({ text, showInNotification = true, children }: CopyOnClickProps) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timeout = setTimeout(() => {
            setCopied(false);
        }, 2500);

        return () => {
            clearTimeout(timeout);
        };
    }, [copied]);

    if (!React.isValidElement(children)) {
        throw new Error('Component passed to <CopyOnClick/> must be a valid React element.');
    }

    const child = !text
        ? React.Children.only(children)
        : React.cloneElement(React.Children.only(children), {
              // @ts-ignore
              className: classNames(children.props.className || '', 'cursor-pointer'),
              onClick: (e: React.MouseEvent<HTMLElement>) => {
                  copy(String(text));
                  setCopied(true);
                  if (typeof children.props.onClick === 'function') {
                      children.props.onClick(e);
                  }
              },
          });

    return (
        <>
            {copied && (
                <Portal>
                    <Fade in unmountOnExit timeout={250} key={copied ? 'visible' : 'invisible'}>
                        <div className={'fixed flex items-center justify-center top-0 w-full p-8 z-[9999]'}>
                            <div
                                className={
                                    'w-fit rounded-2xl py-3 px-4 text-zinc-200 skeleton-anim-2 duration-150 border border-[#ffffff07] shadow-lg select-none pointer-events-none backdrop-blur-xl'
                                }
                                style={{
                                    background:
                                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgba(46, 46, 46, 0.3) 0%, rgb(26, 26, 26, 0.2) 100%)',
                                    animationTimingFunction:
                                        'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                }}
                            >
                                <p className='text-sm font-bold'>
                                    {showInNotification
                                        ? `Copied "${String(text)}" to clipboard.`
                                        : 'Copied text to clipboard.'}
                                </p>
                            </div>
                        </div>
                    </Fade>
                </Portal>
            )}
            {child}
        </>
    );
};

export default CopyOnClick;
