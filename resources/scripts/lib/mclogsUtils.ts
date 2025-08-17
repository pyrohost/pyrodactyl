/**
 * Common crash indicators in server logs
 */
const CRASH_INDICATORS = [
    // Java crash indicators
    'Exception in thread',
    'java.lang.OutOfMemoryError',
    'java.lang.StackOverflowError',
    'java.lang.NullPointerException',
    'java.lang.ClassNotFoundException',
    'java.lang.NoClassDefFoundError',
    'java.lang.IllegalArgumentException',
    'java.lang.IllegalStateException',
    'java.lang.UnsupportedOperationException',
    'java.util.ConcurrentModificationException',
    'java.io.FileNotFoundException',
    'java.net.ConnectException',
    'java.sql.SQLException',

    // Minecraft-specific crashes
    'Server crash report',
    'Crash Report',
    '---- Minecraft Crash Report ----',
    'A detailed walkthrough of the error',
    'org.spigotmc.',
    'net.minecraft.',
    'com.mojang.',
    'net.minecraftforge.',
    'net.fabricmc.',

    // Generic server crashes
    'Internal server error',
    'Server crashed',
    'Fatal error',
    'Process crashed',
    'Segmentation fault',
    'Core dumped',
    'Aborted',

    // Status messages that indicate crashes
    'Process marked as offline',
    'Server marked as offline',
    'Crashed with exit code',
    'Unexpected shutdown',
    'ERROR',
    'FATAL',
];

/**
 * Determines if a log line indicates a server crash
 */
export const isCrashLine = (line: string): boolean => {
    const lowerLine = line.toLowerCase();
    return CRASH_INDICATORS.some((indicator) => lowerLine.includes(indicator.toLowerCase()));
};

/**
 * Extracts relevant log lines around crashes for analysis
 */
export const extractRelevantLogs = (logs: string[], maxLines: number = 100): string => {
    // Take the last maxLines lines to get recent context
    const recentLogs = logs.slice(-maxLines);
    return recentLogs.join('\n');
};

/**
 * Debounce function to prevent too many API calls
 */
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number,
): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};
