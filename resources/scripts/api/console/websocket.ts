import axios from 'axios';

interface WebSocketEvents {
    onStatusChange: (status: string) => void;
    onConsoleOutput: (line: string) => void;
    onConnectionChange: (state: boolean) => void;
}

interface WebSocketResponse {
    data: {
        token: string;
        socket: string;
    }
}

interface WebSocketMessage {
    event: string;
    args: any[];
}

export class ServerWebSocket {
    private ws: WebSocket | null = null;
    private events: WebSocketEvents;
    private token: string | null = null;
    private serverUuid: string | null = null;
    private authenticated: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 3;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private messageQueue: string[] = [];

    constructor(events: WebSocketEvents) {
        this.events = events;
    }

    async connect(serverUuid: string) {
        try {
            this.serverUuid = serverUuid;
            console.log('Connecting to server:', serverUuid);
    
            const { data } = await axios.get<WebSocketResponse>(
                `/api/client/servers/${serverUuid}/websocket`
            );

            console.log("DATA GIVEN FROM API, AFTER ASKING FOR SOME BS",data);
    
            this.token = data.data.token;
            
            console.log('Establishing WebSocket connection...');
            this.ws = new WebSocket(data.data.socket);
            this.setupListeners();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Connection failed:', error.response?.data || error.message);
            } else {
                console.error('Connection failed:', error);
            }
            this.handleReconnect();
        }
    }

    private setupListeners() {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected, authenticating...');
            this.reconnectAttempts = 0;
            this.authenticate();
        };

        this.ws.onmessage = (event) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);
                this.handleMessage(data);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            this.authenticated = false;
            this.events.onConnectionChange(false);
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleReconnect();
        };
    }

    private authenticate() {
        if (!this.ws || !this.token) {
            console.error('Cannot authenticate: missing WebSocket or token');
            return;
        }
        
        this.ws.send(JSON.stringify({ 
            event: "auth", 
            args: [this.token] 
        }));
    }

    private handleMessage(data: WebSocketMessage) {
        switch (data.event) {
            case 'auth success':
                console.log('Authentication successful');
                this.authenticated = true;
                this.events.onConnectionChange(true);
                this.processMessageQueue();
                this.requestInitialLogs();
                break;

            case 'status':
                this.events.onStatusChange(data.args[0]);
                break;

            case 'console output':
                if (Array.isArray(data.args[0])) {
                    data.args[0].forEach((line: string) => {
                        this.events.onConsoleOutput(line);
                    });
                } else {
                    this.events.onConsoleOutput(data.args[0]);
                }
                break;

            case 'token expiring':
                this.handleTokenExpiring();
                break;

            default:
                console.warn('Unhandled WebSocket event:', data.event);
        }
    }

    private processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const command = this.messageQueue.shift();
            if (command) this.sendCommand(command);
        }
    }

    private requestInitialLogs() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ 
                event: "send logs", 
                args: [null] 
            }));
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        const delay = 1000 * Math.pow(2, this.reconnectAttempts);
        console.log(`Attempting reconnection in ${delay}ms...`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            if (this.serverUuid) {
                this.connect(this.serverUuid);
            }
        }, delay);
    }

    private handleTokenExpiring() {
        if (this.serverUuid) {
            this.connect(this.serverUuid);
        }
    }

    public sendCommand(command: string) {
        if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ 
                event: "send command", 
                args: [command] 
            }));
        } else {
            console.log('Queueing command for later execution');
            this.messageQueue.push(command);
        }
    }

    public disconnect() {
        console.log('Disconnecting WebSocket...');
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.authenticated = false;
        this.token = null;
        this.serverUuid = null;
        this.messageQueue = [];
    }
}