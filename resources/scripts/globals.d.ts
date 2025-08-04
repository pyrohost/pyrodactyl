declare module '*.jpg';
declare module '*.png';
declare module '*.svg';
declare module '*.css';

interface Window {
    friendlyChallenge?: {
        WidgetInstance: new (
            element: HTMLElement,
            options: {
                startMode: string;
                doneCallback: (response: string) => void;
                errorCallback: () => void;
                expiredCallback: () => void;
            },
            config: { sitekey: string },
        ) => {
            reset: () => void;
            destroy: () => void;
        };
    };
}
