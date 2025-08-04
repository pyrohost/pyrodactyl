const _CONVERSION_UNIT = 1024;
type ByteUnit = 'Bytes' | 'KiB' | 'MiB' | 'GiB' | 'TiB';

/**
 * Given a value in megabytes converts it back down into bytes.
 */
function mbToBytes(megabytes: number): number {
    return Math.floor(megabytes * _CONVERSION_UNIT * _CONVERSION_UNIT);
}

/**
 * Given an amount of bytes, converts them into a human readable string format
 * using "1024" as the divisor.
 */
function bytesToString(bytes: number, decimals = 2, desiredUnit: ByteUnit = 'Bytes'): string {
    const k = _CONVERSION_UNIT;
    const units: ByteUnit[] = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

    if (bytes < 1) return `0 ${desiredUnit}`;

    decimals = Math.floor(Math.max(0, decimals));

    if (desiredUnit !== 'Bytes') {
        const unitIndex = units.indexOf(desiredUnit);
        const value = Number((bytes / Math.pow(k, unitIndex)).toFixed(decimals));
        return `${value} ${desiredUnit}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = Number((bytes / Math.pow(k, i)).toFixed(decimals));

    return `${value} ${units[i]}`;
}

/**
 * Formats an IPv4 or IPv6 address.
 */
function ip(value: string): string {
    // noinspection RegExpSimplifiable
    return /([a-f0-9:]+:+)+[a-f0-9]+/.test(value) ? `[${value}]` : value;
}

export { ip, mbToBytes, bytesToString };
