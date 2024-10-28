import { LucideCircleAlert } from 'lucide-react';
import { Component } from 'react';

interface State {
    hasError: boolean;
}

// eslint-disable-next-line @typescript-eslint/ban-types
class ErrorBoundary extends Component<{}, State> {
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

        const title = 'Connection Lost';
        const message = 'An error was encountered by the application while rendering this view. Try refreshing the page.';
        const retryMessage = 'Please try again later or contact support if the issue persists.';

        return this.state.hasError ? (
            
            <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                                <LucideCircleAlert size={64} className="text-red-500" />
                            </div>
                            <div className="flex flex-col gap-2 text-left">
                                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white">{title}</h1>
                                <p className="text-gray-300">{message}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-800 p-4 text-center">
                            <p className="text-zinc-200 text-sm">{retryMessage}</p>
                        </div>
            </div>
        ) : (
            (this.props as { children: React.ReactNode }).children
        );
    }
}

export default ErrorBoundary;


