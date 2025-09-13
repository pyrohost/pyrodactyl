import { Component, ReactNode } from 'react';
import { withTranslation } from 'react-i18next';

interface Props {
    children?: ReactNode;
    t: (key: string) => string;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    override state: State = {
        hasError: false,
    };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        console.error(error);
    }

    override render() {
        const { t } = this.props;
        if (this.state.hasError) {
            return (
                <div className={`flex items-center justify-center w-full my-4`}>
                    <div className={`flex items-center bg-neutral-900 rounded-sm p-3 text-red-500`}>
                        <p className={`text-sm text-neutral-100`}>
                            {t('errors.rendering_error')}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default withTranslation()(ErrorBoundary);
