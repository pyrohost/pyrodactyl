import { useState } from 'react';

import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import MetaDataIcon from '@/components/elements/hugeicons/MetaData';

import { formatObjectToIdentString } from '@/lib/objects';

export default ({ meta }: { meta: Record<string, unknown> }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={'self-center md:px-4'}>
            <Dialog open={open} onClose={() => setOpen(false)} hideCloseIcon title={'Metadata'}>
                <pre
                    className={
                        'bg-zinc-900 rounded p-2 font-mono text-sm leading-relaxed overflow-x-scroll whitespace-pre-wrap'
                    }
                >
                    {formatObjectToIdentString(meta)}
                </pre>
                <Dialog.Footer>
                    <Button.Text onClick={() => setOpen(false)}>Close</Button.Text>
                </Dialog.Footer>
            </Dialog>
            <button
                aria-describedby={'View additional event metadata'}
                className={
                    'p-2 transition-colors duration-100 text-zinc-400 group-hover:text-zinc-300 group-hover:hover:text-zinc-50'
                }
                onClick={() => setOpen(true)}
            >
                <MetaDataIcon fill='currentColor' className={'w-5 h-5'} />
            </button>
        </div>
    );
};
