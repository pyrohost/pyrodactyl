import { Component } from 'react';
import { withTranslation } from 'react-i18next';

interface State {
    hasError: boolean;
}

interface ErrorBoundaryProps {
    t: (key: string) => string;
}

/**
 * Component bắt lỗi React và hiển thị thông báo lỗi thân thiện
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
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

        return this.state.hasError ? (
            <div className={`flex items-center justify-center w-full my-4`}>
                <div className={`flex items-center bg-neutral-900 rounded p-3 text-red-500`}>
                    <p className={`text-sm text-neutral-100`}>{t('errors.rendering_error')}</p>
                </div>
            </div>
        ) : (
            (this.props as any).children
        );
    }
}

export default withTranslation()(ErrorBoundary);
