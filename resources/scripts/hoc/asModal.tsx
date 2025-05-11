import ModalContext, { ModalContextValues } from '@/context/ModalContext';
import { PureComponent } from 'react';

import PortaledModal, { ModalProps } from '@/components/elements/Modal';

export interface AsModalProps {
    visible: boolean;
    onModalDismissed?: () => void;
}

export type SettableModalProps = Omit<ModalProps, 'appear' | 'visible' | 'onDismissed'>;

interface State {
    render: boolean;
    visible: boolean;
    propOverrides: Partial<SettableModalProps>;
}

function asModal<P extends object>(
    modalProps?: SettableModalProps | ((props: P) => SettableModalProps),
): (Component: any) => any {
    return function (Component) {
        return class extends PureComponent<P & AsModalProps, State> {
            static displayName = `asModal(${Component.displayName})`;

            constructor(props: P & AsModalProps) {
                super(props);

                this.state = {
                    render: props.visible,
                    visible: props.visible,
                    propOverrides: {},
                };
            }

            get computedModalProps(): Readonly<SettableModalProps & { visible: boolean }> {
                return {
                    ...(typeof modalProps === 'function' ? modalProps(this.props) : modalProps),
                    ...this.state.propOverrides,
                    visible: this.state.visible,
                };
            }

            override componentDidUpdate(prevProps: Readonly<P & AsModalProps>) {
                if (this.props.visible !== prevProps.visible) {
                    this.setState({
                        render: this.props.visible,
                        visible: this.props.visible,
                        propOverrides: this.props.visible ? this.state.propOverrides : {},
                    });
                }
            }

            dismiss = () => {
                if (this.props.onModalDismissed) {
                    this.props.onModalDismissed();
                }
            };

            setPropOverrides: ModalContextValues['setPropOverrides'] = (value) =>
                this.setState((state) => ({
                    propOverrides: !value ? {} : typeof value === 'function' ? value(state.propOverrides) : value,
                }));

            override render() {
                if (!this.state.render) return null;

                return (
                    <PortaledModal
                        onDismissed={() => {
                            this.setState({ render: false });
                            if (typeof this.props.onModalDismissed === 'function') {
                                this.props.onModalDismissed();
                            }
                        }}
                        {...this.computedModalProps}
                    >
                        <ModalContext.Provider
                            value={{
                                dismiss: this.dismiss.bind(this),
                                setPropOverrides: this.setPropOverrides.bind(this),
                            }}
                        >
                            <Component {...this.props} />
                        </ModalContext.Provider>
                    </PortaledModal>
                );
            }
        };
    };
}

export default asModal;
