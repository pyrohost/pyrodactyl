import { useEffect, useState } from 'react';
import { WebSocketStatus, SubscribeToWebsocket } from '@/state/server/webSocketState';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import { useStatusPillOverride } from './StatusPillContext';

function WebsocketHandler() {
    const [status, setStatus] = useState<WebSocketStatus>(WebSocketStatus.DISCONNECTED);
    const [isVisible, setIsVisible] = useState(true);
    


    useEffect(() => {
        const unsubscribe = SubscribeToWebsocket(setStatus);
       
        return unsubscribe;
    }, []);

    useEffect(() => {
        setIsVisible(true);
        let timeout: NodeJS.Timeout;

        if (status === WebSocketStatus.CONNECTED) {
            timeout = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }

        return () => clearTimeout(timeout);
    }, [status]);

    const statusConfig = {
        [WebSocketStatus.CONNECTED]: {
            icon: <CheckCircle className="h-4 w-4" />,
            text: "Connected",
            bg: "bg-green-500/80"
        },
        [WebSocketStatus.DISCONNECTED]: {
            icon: <XCircle className="h-4 w-4" />,
            text: "Disconnected",
            bg: "bg-red-500/80"
        },
        [WebSocketStatus.CONNECTING]: {
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
            text: "Connecting",
            bg: "bg-yellow-500/80"
        }
    };

    const currentStatus = statusConfig[status];

    return (
        <FadeTransition duration='duration-150' show={isVisible}>
            <div 
                className={`
                    flex items-center px-4 rounded-full fixed w-fit mx-auto 
                    left-0 right-0 top-4 ${currentStatus.bg} py-2 z-[9999]
                    transition-all duration-300 ease-in-out
                    ${!isVisible ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
                    ${status === WebSocketStatus.CONNECTED ? '' : ''}
                `}
            >
                {currentStatus.icon}
                <p className="ml-2 text-sm text-white">
                    Terminal {currentStatus.text}
                </p>
            </div>
        </FadeTransition>
    );
}

export default WebsocketHandler;