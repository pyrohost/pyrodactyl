import { usePage } from '@inertiajs/react';
import clsx from 'clsx';
import debounce from 'debounce';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import parse from 'ansi-to-html';

import { Card, CardContent } from "@/components/ui/card";
import { ServerWebSocket } from '@/api/console/websocket';

import useEventListener from '@/plugins/useEventListener';

interface ServerPageProps {
  server: {
    id: string;
    uuid: string;
    isTransferring: boolean;
  };
}

interface TerminalLine {
  id: number;
  content: string;
  type: 'input' | 'output';
}

const CustomTerminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { server } = usePage<ServerPageProps>().props;
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState('offline');
  const wsService = useRef<ServerWebSocket | null>(null);
  const ansiToHtml = new parse();

  const TERMINAL_PRELUDE = 'Pastel-Package@datacenter~ ';

  const handleConsoleOutput = (line: string) => {
    const htmlContent = ansiToHtml.toHtml(line);
    setLines(prev => [...prev, { id: Date.now(), content: htmlContent, type: 'output' }]);
    scrollToBottom();
  };

  const handlePowerChangeEvent = (state: string) => {
    console.log(`Server status changed to: ${state}`);
    setServerStatus(state);
    if (state === 'offline') {
      setLines([{ id: Date.now(), content: 'Server offline', type: 'output' }]);
    }
  };

  useEffect(() => {
    console.log(`Initializing WebSocket connection for server: ${server.uuid}`);
    
    wsService.current = new ServerWebSocket({
        onStatusChange: handlePowerChangeEvent,
        onConsoleOutput: handleConsoleOutput,
        onConnectionChange: (state) => {
            setConnected(state);
            console.log(`WebSocket connection state: ${state ? 'connected' : 'disconnected'}`);
        }
    });
    console.log("SERVER UUID, ", server.uuid)

    wsService.current.connect(server.uuid);
    

    return () => {
        console.log('Cleaning up WebSocket connection');
        wsService.current?.disconnect();
    };
}, [server.uuid]);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  };

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentInput.trim() && serverStatus === 'running') {
      setLines(prev => [...prev, { id: Date.now(), content: currentInput, type: 'input' }]);
      
      if (currentInput === '>>restart') {
        setLines([{ id: Date.now(), content: 'Restarting terminal...', type: 'output' }]);
      } else if (currentInput === '>>ver') {
        handleConsoleOutput('Terminal Version: Pastelix-1');
      } else if (currentInput === '>>harun') {
        handleConsoleOutput('Harun WTF BRO, I am not a bot');

      } else if (currentInput === '>>help') {
        handleConsoleOutput('>>restart - Restart the terminal \n >>ver - Check the terminal version \n >>harun - Harun WTF BRO, I am not a bot \n >>stop - Stop the terminal and kill the connection');
      } else if (currentInput === '>>stop') {
        wsService.current?.sendRaw(JSON.stringify({event:"set state",args:["kill"]}));
      } else {
        wsService.current?.sendCommand(currentInput);
      }
      
      setCurrentInput('');
    }
  };

  useEventListener(
    'resize',
    debounce(() => {
      scrollToBottom();
    }, 100),
  );

  return (
    <Card className="transform-gpu skeleton-anim-2 bg-white dark:bg-black backdrop-blur-md border-gray-200 dark:border-zinc-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-0">
        <div className="flex flex-col w-full h-full">
          <motion.div 
            className="relative transition-all duration-300 hover:scale-[1.01] flex flex-col w-full h-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatePresence>
              {!connected && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black bg-opacity-75 dark:bg-opacity-75 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="p-6 bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-white">
                    <CardContent>
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-lg font-semibold">Connecting...</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={clsx('h-[453px] rounded-t-xl pt-4 px-4 bg-gray-50 dark:bg-black transition-colors duration-300 border-x border-t border-gray-200 dark:border-zinc-800', { 'rounded-b': serverStatus !== 'running' })}>
              <div ref={terminalRef} className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {lines.map((line) => (
                  <div key={line.id} className={clsx('font-mono text-sm', {
                    'text-gray-800 dark:text-gray-200': line.type === 'output',
                    'text-blue-600 dark:text-blue-400': line.type === 'input'
                  })}>
                    {line.type === 'input' ? (
                      `${TERMINAL_PRELUDE}${line.content}`
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: line.content }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {serverStatus === 'offline' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-white dark:bg-black bg-opacity-75 dark:bg-opacity-75 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="p-6 bg-white dark:bg-black shadow-lg text-gray-800 dark:text-white">
                    <CardContent>
                      <div className="flex flex-col items-center space-y-4">
                        <img 
                          src="/assets/svgs/Bad-Request.svg"
                          alt="Server Offline"
                          className="w-120 h-60 object-contain"
                        />
                        <p className="text-lg font-semibold">Searching for a connection, Is the server offline?</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {serverStatus === 'running' && (
                <motion.form 
                  onSubmit={handleInputSubmit} 
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    ref={inputRef}
                    className="peer w-full bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-gray-800 dark:text-white px-4 py-2 rounded-b-xl font-mono text-sm"
                    type="text"
                    placeholder="Enter a command"
                    aria-label="Console command input"
                    value={currentInput}
                    onChange={handleInputChange}
                    autoCorrect="off"
                    autoCapitalize="none"
                  />
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </CardContent>
      <motion.div 
        className={`absolute top-4 right-4 px-3 py-1 rounded-full ${serverStatus === 'running' ? 'bg-green-500' : 'bg-red-500'} text-white`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {serverStatus}
      </motion.div>
    </Card>
  );
};

export default CustomTerminal;

