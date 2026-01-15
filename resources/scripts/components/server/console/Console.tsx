import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { type ITerminalOptions, Terminal } from '@xterm/xterm';
import { useSidebar } from '@/contexts/SidebarContext';
import '@xterm/xterm/css/xterm.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import KeyboardShortcut from '@/components/ui/keyboard-shortcut';

import { cn } from '@/lib/utils';
import { usePermissions } from '@/plugins/usePermissions';
import { usePersistedState } from '@/plugins/usePersistedState';
import { ServerContext } from '@/state/server';

const theme = {
    // background: 'rgba(0, 0, 0, 0)',
    background: '#110f0d',
    cursor: 'transparent',
    black: '#000000',
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 12,
    fontFamily: 'monospace, monospace',
    // rows: 30,
    theme: theme,
};

const Console = () => {
    const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pyrodactyl~ \u001b[0m';
    const ref = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps, rows: 30 }), []);
    const fitAddon = useMemo(() => new FitAddon(), []);
    const searchAddon = useMemo(() => new SearchAddon(), []);
    const webLinksAddon = useMemo(() => new WebLinksAddon(), []);
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const { isMinimized } = useSidebar();
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedFit = useDebouncedCallback(() => {
        // FIXME: The proposeDimensions & fit functions seemingly only go one column at a time (until it stabilizes)
        // There's likely an underlying bug somewhere, but for now, here's a loop as a workaround
        if (terminal.element) {
            let lastCols = -1;
            let currentCols = 0;
            let iterations = 0;
            const maxIterations = 100;

            while (lastCols !== currentCols && iterations < maxIterations) {
                const proposedDimensions = fitAddon.proposeDimensions();
                if (!proposedDimensions) {
                    console.warn('Could not propose dimensions for terminal.');
                    return;
                }

                lastCols = currentCols;
                currentCols = proposedDimensions.cols;

                // console.log(`Iteration ${iterations + 1}: Proposed dimensions:`, proposedDimensions);

                terminal.resize(proposedDimensions.cols, proposedDimensions.rows);
                iterations++;
            }

            // if (iterations >= maxIterations) {
            //     console.warn(`Terminal resize reached maximum iterations (${maxIterations})`);
            // } else {
            //     console.log(`Terminal resize stabilized after ${iterations} iterations with cols: ${currentCols}`);
            // }
        }
    }, 200);

    const handleConsoleOutput = useCallback(
        (line: string, prelude = false) =>
            terminal.writeln((prelude ? TERMINAL_PRELUDE : '') + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m'),
        [terminal, TERMINAL_PRELUDE],
    );

    const handleTransferStatus = useCallback(
        (status: string) => {
            switch (status) {
                // Sent by either the source or target node if a failure occurs.
                case 'failure':
                    terminal.writeln(TERMINAL_PRELUDE + 'Transfer has failed.\u001b[0m');
                    return;
            }
        },
        [terminal, TERMINAL_PRELUDE],
    );

    const handleDaemonErrorOutput = useCallback(
        (line: string) =>
            terminal.writeln(
                TERMINAL_PRELUDE + '\u001b[1m\u001b[41m' + line.replace(/(?:\r\n|\r|\n)$/im, '') + '\u001b[0m',
            ),
        [terminal, TERMINAL_PRELUDE],
    );

    const handlePowerChangeEvent = useCallback(
        (state: string) => terminal.writeln(TERMINAL_PRELUDE + 'Server marked as ' + state + '...\u001b[0m'),
        [terminal, TERMINAL_PRELUDE],
    );

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history!.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';

            // By default up arrow will also bring the cursor to the start of the line,
            // so we'll preventDefault to keep it at the end.
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            setHistory((prevHistory) => [command, ...prevHistory!].slice(0, 32));
            setHistoryIndex(-1);

            if (instance) instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
        // Focus input when slash key is pressed
        if (e.key === '/' && inputRef.current && document.activeElement !== inputRef.current) {
            e.preventDefault();
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Add global keydown listener
        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [handleGlobalKeyDown]);

    // Auto-focus input on component mount
    useEffect(() => {
        if (inputRef.current && canSendCommands) {
            inputRef.current.focus();
        }
    }, [canSendCommands]);

    useEffect(() => {
        if (connected && ref.current) {
            // If terminal is already attached to a different element, dispose it first
            if (terminal.element && terminal.element !== ref.current) {
                terminal.dispose();
            }

            // Only set up the terminal if it's not already attached to the current element
            if (!terminal.element || terminal.element !== ref.current) {
                terminal.loadAddon(fitAddon);
                terminal.loadAddon(searchAddon);
                terminal.loadAddon(webLinksAddon);

                terminal.open(ref.current);
                fitAddon.fit();

                // Add support for capturing keys
                terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                        document.execCommand('copy');
                        return false;
                    }
                    // } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    //     e.preventDefault();
                    //     searchBar.show();
                    //     return false;
                    // } else if (e.key === 'Escape') {
                    //     searchBar.hidden();
                    // }
                    return true;
                });

                // Set up ResizeObserver to watch for container size changes
                resizeObserverRef.current = new ResizeObserver(debouncedFit);

                if (ref.current) {
                    resizeObserverRef.current.observe(ref.current);
                }
            }
        }

        // Cleanup function to dispose terminal when component unmounts
        return () => {
            if (terminal.element) {
                terminal.dispose();
            }
            // Clean up the ResizeObserver
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, [terminal, connected, fitAddon, searchAddon, webLinksAddon, debouncedFit]);

    // useEventListener(
    //     'resize',
    //     debounce(() => {
    //         if (terminal.element) {
    //             fitAddon.fit();
    //         }
    //     }, 100),
    // );

    useEffect(() => {
        debouncedFit();
    }, [terminal, isMinimized, fitAddon, debouncedFit]);

    useEffect(() => {
        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring) {
                terminal.clear();
            }

            Object.keys(listeners).forEach((key: string) => {
                const listener = listeners[key];
                if (listener === undefined) {
                    return;
                }

                instance.addListener(key, listener);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    const listener = listeners[key];
                    if (listener === undefined) {
                        return;
                    }

                    instance.removeListener(key, listener);
                });
            }
        };
    }, [
        connected,
        instance,
        isTransferring,
        terminal,
        handleConsoleOutput,
        handleDaemonErrorOutput,
        handlePowerChangeEvent,
        handleTransferStatus,
    ]);

    return (
        <div className='flex w-full h-full'>
            <div className={cn('relative flex size-full flex-col overflow-x-hidden contain-inline-size flex-1')}>
                <SpinnerOverlay visible={!connected} size={'large'} />
                <div
                    className={cn(
                        'bg-bg-raised border-mocha-400 p-4 flex flex-1 flex-col overflow-hidden rounded-2xl border text-sm',
                        {
                            'rounded-b': !canSendCommands,
                        },
                    )}
                >
                    <div className='size-full' ref={ref} />

                    {canSendCommands && (
                        <div className='w-full rounded-2xl border border-mocha-300 bg-mocha-400 p-2 text-zinc-100 flex px-(--padding-x) relative [--padding-x:--spacing(4)] text-sm'>
                            <input
                                ref={inputRef}
                                className='w-full'
                                type={'text'}
                                placeholder={'Enter a command'}
                                aria-label={'Console command input.'}
                                disabled={!instance || !connected}
                                onKeyDown={handleCommandKeyDown}
                                autoCorrect={'off'}
                                autoCapitalize={'none'}
                            />
                            <KeyboardShortcut keys={['/']} variant='faded' className='pl-(--padding-x)' />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Console;
