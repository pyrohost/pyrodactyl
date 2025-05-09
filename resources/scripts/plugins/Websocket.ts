import { EventEmitter } from 'events';
import Sockette from 'sockette';

export class Websocket extends EventEmitter {
    // Timer instance for this socket.
    private timer: any = null;

    // The backoff for the timer, in milliseconds.
    private backoff = 5000;

    // The socket instance being tracked.
    private socket: Sockette | null = null;

    // The URL being connected to for the socket.
    private url: string | null = null;

    // The authentication token passed along with every request to the Daemon.
    // By default this token expires every 15 minutes and must therefore be
    // refreshed at a pretty continuous interval. The socket server will respond
    // with "token expiring" and "token expired" events when approaching 3 minutes
    // and 0 minutes to expiry.
    private token = '';

    // Connects to the websocket instance and sets the token for the initial request.
    connect(url: string): this {
        this.url = url;

        this.socket = new Sockette(`${this.url}`, {
            onmessage: (e) => {
                try {
                    const { event, args } = JSON.parse(e.data);
                    if (args) {
                        this.emit(event, ...args);
                    } else {
                        this.emit(event);
                    }
                } catch (ex) {
                    console.warn('Failed to parse incoming websocket message.', ex);
                }
            },
            onopen: () => {
                // Clear the timers, we managed to connect just fine.
                if (this.timer) clearTimeout(this.timer);
                this.backoff = 5000;

                this.emit('SOCKET_OPEN');
                this.authenticate();
            },
            onreconnect: () => {
                this.emit('SOCKET_RECONNECT');
                this.authenticate();
            },
            onclose: () => this.emit('SOCKET_CLOSE'),
            onerror: (error) => this.emit('SOCKET_ERROR', error),
        });

        this.timer = setTimeout(() => {
            this.backoff = this.backoff + 2500 >= 20000 ? 20000 : this.backoff + 2500;
            if (this.socket) this.socket.close();
            clearTimeout(this.timer);

            // Re-attempt connecting to the socket.
            this.connect(url);
        }, this.backoff);

        return this;
    }

    // Sets the authentication token to use when sending commands back and forth
    // between the websocket instance.
    setToken(token: string, isUpdate = false): this {
        this.token = token;

        if (isUpdate) {
            this.authenticate();
        }

        return this;
    }

    authenticate() {
        if (this.url && this.token) {
            this.send('auth', this.token);
        }
    }

    close(code?: number, reason?: string) {
        this.url = null;
        this.token = '';
        if (this.socket) this.socket.close(code, reason);
    }

    open() {
        if (this.socket) this.socket.open();
    }

    reconnect() {
        if (this.socket) this.socket.reconnect();
    }

    send(event: string, payload?: string | string[]) {
        if (this.socket) {
            this.socket.send(
                JSON.stringify({
                    event,
                    args: Array.isArray(payload) ? payload : [payload],
                }),
            );
        }
    }
}
