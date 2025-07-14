import { useState } from 'react';

import { Dialog, DialogProps, DialogWrapperContext, WrapperProps } from '@/components/elements/dialog';

function asDialog(
    initialProps?: WrapperProps,
): <P extends object>(C: React.ComponentType<P>) => React.FunctionComponent<P & DialogProps> {
    return function (Component) {
        const WrappedComponent = function ({ open, onClose, ...rest }) {
            const [props, setProps] = useState<WrapperProps>(initialProps || {});

            return (
                <DialogWrapperContext.Provider value={{ props, setProps, close: onClose }}>
                    <Dialog {...props} open={open} onClose={onClose}>
                        <Component {...(rest as unknown as React.ComponentProps<typeof Component>)} />
                    </Dialog>
                </DialogWrapperContext.Provider>
            );
        };

        WrappedComponent.displayName = `asDialog(${Component.displayName || Component.name || 'Component'})`;

        return WrappedComponent;
    };
}

export default asDialog;
