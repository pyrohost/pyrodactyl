import { Component } from 'react';

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Record<string, never>, State> {
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
        return this.state.hasError ? (
            <div className={`flex items-center justify-center w-full my-4`}>
                <div className={`flex items-center bg-neutral-900 rounded-sm p-3 text-red-500`}>
                    <p className={`text-sm text-neutral-100`}>
                        An error was encountered by the application while rendering this view. Try refreshing the page.
                    </p>
                </div>
            </div>
        ) : (
            (this.props as { children: React.ReactNode }).children
        );
    }
}

export default ErrorBoundary;
