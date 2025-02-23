export enum WebSocketStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting'
}

type StatusListener = (status: WebSocketStatus) => void;

class WebSocketState {
    private static instance: WebSocketState;
    private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
    private listeners: StatusListener[] = [];

    private constructor() {}

    static getInstance(): WebSocketState {
        if (!WebSocketState.instance) {
            WebSocketState.instance = new WebSocketState();
        }
        return WebSocketState.instance;
    }

    public updateStatus(status: WebSocketStatus) {
        this.status = status;
        this.notifyListeners();
    }

    public getStatus(): WebSocketStatus {
        return this.status;
    }

    public subscribe(listener: StatusListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.status));
    }
}

// Export convenience methods
export const UpdateStatusWebsocket = (status: WebSocketStatus) => {
    WebSocketState.getInstance().updateStatus(status);
};

export const GetStatusWebsocket = (): WebSocketStatus => {
    return WebSocketState.getInstance().getStatus();
};

export const SubscribeToWebsocket = (listener: StatusListener) => {
    return WebSocketState.getInstance().subscribe(listener);
};