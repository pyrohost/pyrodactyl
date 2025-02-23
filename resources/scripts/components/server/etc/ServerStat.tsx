import React from 'react';
import { bytesToString } from '@/lib/formatters';

interface ServerStatProps {
    label: string;
    value: string;
    limit?: number;
    type: 'cpu' | 'memory' | 'disk';
}

const ServerStat: React.FC<ServerStatProps> = ({ label, value, limit, type }) => {
    const getLimitDisplay = () => {
        if (!limit || limit === 0) return 'Unlimited';
        if (type === 'cpu') return `${limit}%`;
        return bytesToString(limit * 1024 * 1024, 0);
    };

    return (
        <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 px-3 py-1 dark:bg-zinc-700 rounded-lg bg-zinc-200">
                {label}: {value} {/* {getLimitDisplay()} */}
            </span>
        </div>
    );
};

export default ServerStat;