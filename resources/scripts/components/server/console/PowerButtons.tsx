import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import sendPowerSignal from '@/api/server/ServerPower';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePage } from "@inertiajs/react";
import { LucideMessageCircleWarning, LucideMessageSquareWarning, LucideTerminal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { SetStatus, statusManager, useStatusPillOverride } from '../StatusPillContext';


interface PowerButtonProps {
    serverId: string;
    className?: string;
}

type ServerState = 'running' | 'stopping' | 'starting' | 'offline';

const PowerButtons = ({ serverId, className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<ServerState | null>(null);
    const [isNodeOffline, setIsNodeOffline] = useState(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const { server } = usePage().props as { server: { uuid: string } };
    const { toast } = useToast(); // Add useToast hook
    
    console.log('server start', status)

    useEffect(() => {
        const setupEventSource = () => {
            try {
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                }

                eventSourceRef.current = new EventSource(`/api/client/servers/${serverId}/resources/stream`);

                eventSourceRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        const newState = data.attributes.current_state as ServerState;
                        console.log('Server state:', newState);
                        setStatus(newState);
                        setIsNodeOffline(false);
                        
                        if (loading && newState !== status) {
                            setLoading(false);
                        }
                    } catch (err) {
                        console.error('Error parsing stats:', err);
                        setIsNodeOffline(true);
                    }
                };

                eventSourceRef.current.onerror = () => {
                    console.error('EventSource connection failed');
                    setIsNodeOffline(true);
                    eventSourceRef.current?.close();
                    setTimeout(setupEventSource, 1000);
                };
            } catch (err) {
                console.error('Failed to setup EventSource:', err);
                setIsNodeOffline(true);
            }
        };

        setupEventSource();
        return () => eventSourceRef.current?.close();
    }, [serverId, loading, status]);

    useEffect(() => {
        setErrorDialogOpen(isNodeOffline);
    }, [isNodeOffline]);

    const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'kill') => {
        setLoading(true);
        try {
            try {
                statusManager.setStatus(`New action!`, 'bg-yellow-500/10 text-yellow-500');
                setTimeout(() => {
                    statusManager.setStatus(`Server has been ${action}ed`, 'bg-green-500/10 text-green-500');
                }, 1000);
                console.log('Status set successfully');
            } catch (error) {
                console.error('Failed to set status:', error);
            }
            toast({
                title: (
                    <div className="flex items-center">
                        <LucideMessageCircleWarning className="w-4 h-4 mr-2 text-red-500" />
                        Power Action: {action.charAt(0).toUpperCase() + action.slice(1)}
                    </div>
                ),
                description: `Server power signal sent successfully. Action: ${action}`,
            });
            
            await sendPowerSignal(serverId, action);
            
            
        } catch (error) {
            toast({
                title: (
                    <div className="flex items-center">
                        <LucideMessageSquareWarning className="w-4 h-4 mr-2 text-red-500" />
                        Error
                    </div>
                ),
                description: "Failed to send power signal to the server",
                variant: "destructive",
            });
            setLoading(false);
        }
        setOpen(false);
    };

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
    };

    return (
        <div className="flex items-center justify-end gap-2 right-9">
            <Dialog open={open} onOpenChange={setOpen} className='bg-white dark:bg-black '>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kill Server</DialogTitle>
                        <img 
              src="/assets/svgs/bad.svg"
              alt="Create New"
              className="w-120 h-60 object-contain"
            />
                        <DialogDescription>
                            This power action will forcibly stop the server, which is considered unsafe and may result in data loss.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} className='mb-3'>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handlePowerAction('kill')}
                            disabled={loading}
                        >
                            Kill Server
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive text-center">Node Connection Lost</DialogTitle>
                        <img 
              src="/assets/svgs/connection-lost.svg"
              alt="Create New"
              className="w-120 h-60 object-contain"
            />
                        <DialogDescription className='text-center'>
                            We couldn't connect to the node. Please contact support if this issue persists.
                        </DialogDescription>
                        
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AnimatePresence>
                <motion.div
                    key="start"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    <Button
                        variant="default"
                        onClick={() => handlePowerAction('start')}
                        disabled={loading || status !== 'offline' || isNodeOffline}
                        className="w-24"
                    >
                        Start
                    </Button>
                </motion.div>

                <motion.div
                    key="restart"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    <Button
                        variant="outline"
                        onClick={() => handlePowerAction('restart')}
                        disabled={loading || status !== 'running' || isNodeOffline}
                        className="w-24"
                    >
                        Restart
                    </Button>
                </motion.div>

                <motion.div
                    key="stop"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    <Button
                        variant="destructive"
                        onClick={() => status === 'stopping' ? setOpen(true) : handlePowerAction('stop')}
                        disabled={loading || (status !== 'running' && status !== 'starting') || isNodeOffline}
                        className="w-24"
                    >
                        {status === 'stopping' ? 'Killing' : status === 'starting' ? 'Starting' : 'Stop'}
                    </Button>
                </motion.div>

                <motion.div
                    key="kill"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    <Button
                        variant="destructive"
                        onClick={() => setOpen(true)}
                        disabled={loading || status === 'offline' || isNodeOffline}
                        className="w-24 dark:bg-black bg-white shadow-lg text-red-900 font-bold dark:hover:bg-zinc-800"
                    >
                        Kill
                    </Button>
                </motion.div>

                <motion.div
            key="console"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
        >
            <Button
                asChild
                variant="default"
                className="w-24 dark:bg-black bg-white dark:text-zinc-100 text-black hover:bg-primary/10  dark:hover:bg-primary/10"
            >
                <Link href={`/server/${server.identifier}/console`}>
                    <LucideTerminal className="w-4 h-4 mr-2" />
                    Console
                </Link>
            </Button>
        </motion.div>

                
            </AnimatePresence>
        </div>
    );
};

export default PowerButtons;