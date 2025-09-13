import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsCode from '@/components/elements/hugeicons/Code';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';

import { formatObjectToIdentString } from '@/lib/objects';

const ActivityLogMetaButton = ({ meta }: { meta: Record<string, unknown> }) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy metadata:', err);
        }
    };

    const metadataString = formatObjectToIdentString(meta);
    const metadataJson = JSON.stringify(meta, null, 2);

    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} hideCloseIcon title={'Event Metadata'}>
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h4 className='text-sm font-medium text-zinc-300'>Formatted View</h4>
                        <ActionButton
                            variant='secondary'
                            onClick={copyToClipboard}
                            className='flex items-center gap-2 text-xs'
                        >
                            <HugeIconsCopy className='w-3 h-3' />
                            {copied ? 'Copied!' : 'Copy JSON'}
                        </ActionButton>
                    </div>

                    <div className='bg-zinc-900 rounded-lg p-4 border border-zinc-800 max-h-96 overflow-auto'>
                        <pre className='font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-300'>
                            {metadataString}
                        </pre>
                    </div>

                    <div>
                        <h4 className='text-sm font-medium text-zinc-300 mb-2'>Raw JSON</h4>
                        <div className='bg-zinc-900 rounded-lg p-4 border border-zinc-800 max-h-64 overflow-auto'>
                            <pre className='font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400'>
                                {metadataJson}
                            </pre>
                        </div>
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton variant='secondary' onClick={() => setOpen(false)}>
                        Close
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>

            <button
                aria-label='View additional event metadata'
                className='w-6 h-6 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors duration-150 flex items-center justify-center'
                onClick={() => setOpen(true)}
            >
                <HugeIconsCode className='w-3 h-3' />
            </button>
        </>
    );
};

export default ActivityLogMetaButton;
