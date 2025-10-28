import { Progress } from '@radix-ui/react-progress';
import { X } from 'lucide-react';

import Code from '@/components/elements/Code';

import { cn } from '@/lib/utils';

import { useStoreActions } from '@/state/hooks';
import { ServerContext } from '@/state/server';

// Assuming you use a utility like this for conditional classnames

interface FileUploadRowProps {
    name: string;
    loaded: number;
    total: number;
}

export default function FileUploadRow({ name, loaded, total }: FileUploadRowProps) {
    const cancel = ServerContext.useStoreActions((actions) => actions.files.cancelFileUpload);

    const percent = Math.floor((loaded / total) * 100);

    return (
        <div className='flex items-center px-4 py-3 bg-zinc-800 border-b border-zinc-700 rounded-md space-x-4'>
            <div className='flex-1 truncate'>
                <Code>{name}</Code>
            </div>

            <div className='flex flex-col w-1/3'>
                <Progress value={percent} className='h-2 rounded bg-zinc-700 overflow-hidden'>
                    <div className='h-full bg-blue-500 transition-all' style={{ width: `${percent}%` }} />
                </Progress>
                <div className='text-xs text-zinc-400 mt-1'>{percent}%</div>
            </div>

            <button
                onClick={() => cancelFileUpload(name)}
                className={cn('text-red-400 hover:text-red-200 transition-colors', 'p-1')}
                title='Cancel upload'
            >
                <X size={16} />
            </button>
        </div>
    );
}
