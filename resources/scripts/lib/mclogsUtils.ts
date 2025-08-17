export const CRASH_INDICATORS = [
    // Java / JVM
    'exception in thread "main"',
    'java.lang.outofmemoryerror',
    'java.lang.stackoverflowerror',
    'java.lang.nullpointerexception',
    'java.lang.classnotfoundexception',
    'java.lang.noclassdeffounderror',
    'a fatal error has been detected by the java runtime environment',

    // Minecraft
    '---- minecraft crash report ----',
    'crash report',
    'unexpected exception',

    // Watchdog
    'watchdog',
    'single server tick took',

    // Networking / binding
    'address already in use',
    'failed to bind to port',

    // System / container
    'segmentation fault',
    'core dumped',
    'aborted',
    'process crashed',
    'detected server process in a crashed state',
    'server marked as offline',
    'process marked as offline',

    // Generic
    'fatal error',
    'server crashed',
    'unexpected shutdown',
];

const CRASH_REGEX = [
    /hs_err_pid\d+\.log/i, // JVM fatal report files
    /\bexit code[: ]\s*(1|137|139|143)\b/i, // common crash exit codes
    /\boom-?killer?\b/i, // OOM killer
];

export const isCrashLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    if (CRASH_INDICATORS.some((s) => lower.includes(s))) return true;
    return CRASH_REGEX.some((r) => r.test(line));
};

export const extractRelevantLogs = (
    logs: string[],
    maxLines: number = 150,
    linesBefore: number = 75,
    linesAfter: number = 75,
): string => {
    if (!logs.length) return '';

    // find index of last crash-looking line
    let hit = -1;
    for (let i = logs.length - 1; i >= 0; i--) {
        const line = logs[i];
        if (line && isCrashLine(line)) {
            hit = i;
            break;
        }
    }

    if (hit === -1) {
        return logs.slice(-maxLines).join('\n');
    }

    // widen a bit if it's a full MC crash report header
    const crashLine = logs[hit];
    const isMcReportHeader = crashLine ? /---- minecraft crash report ----/i.test(crashLine) : false;
    const before = isMcReportHeader ? Math.max(linesBefore, 100) : linesBefore;
    const after = isMcReportHeader ? Math.max(linesAfter, 100) : linesAfter;

    const start = Math.max(0, hit - before);
    const end = Math.min(logs.length, hit + after);

    let slice = logs.slice(start, end);

    // enforce maxLines (keep the crash line roughly centered)
    if (slice.length > maxLines) {
        const extra = slice.length - maxLines;
        const dropFront = Math.ceil(extra / 2);
        slice = slice.slice(dropFront, dropFront + maxLines);
    }

    return slice.join('\n');
};

/**
 * Tiny debounce for browser/Node.
 */
export const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
};
