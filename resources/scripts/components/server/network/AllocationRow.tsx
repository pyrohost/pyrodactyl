import debounce from 'debounce';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Code from '@/components/elements/Code';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Textarea } from '@/components/elements/Input';
import InputSpinner from '@/components/elements/InputSpinner';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import HugeIconsCheck from '@/components/elements/hugeicons/Check';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';
import HugeIconsCrown from '@/components/elements/hugeicons/Crown';
import HugeIconsNetworkAntenna from '@/components/elements/hugeicons/NetworkAntenna';
import HugeIconsTrash from '@/components/elements/hugeicons/Trash';
import HugeIconsX from '@/components/elements/hugeicons/X';
import { PageListItem } from '@/components/elements/pages/PageList';

import { ip } from '@/lib/formatters';

import { Allocation } from '@/api/server/getServer';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import getServerAllocations from '@/api/swr/getServerAllocations';

import { ServerContext } from '@/state/server';

import { useFlashKey } from '@/plugins/useFlash';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(allocation.notes || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback(
        (id: number, notes: string) => {
            mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
        },
        [mutate],
    );

    const saveNotes = useCallback(() => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notesValue)
            .then(() => {
                onNotesChanged(allocation.id, notesValue);
                setIsEditingNotes(false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, [uuid, allocation.id, notesValue, onNotesChanged, clearFlashes, clearAndAddHttpError]);

    const cancelEdit = useCallback(() => {
        setNotesValue(allocation.notes || '');
        setIsEditingNotes(false);
    }, [allocation.notes]);

    const startEdit = useCallback(() => {
        setIsEditingNotes(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }, []);

    useEffect(() => {
        setNotesValue(allocation.notes || '');
    }, [allocation.notes]);

    // Format the full allocation string for copying
    const allocationString = allocation.alias
        ? `${allocation.alias}:${allocation.port}`
        : `${ip(allocation.ip)}:${allocation.port}`;

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    const deleteAllocation = () => {
        if (!confirm('Are you sure you want to delete this allocation?')) return;

        clearFlashes();
        setDeleteLoading(true);

        deleteServerAllocation(uuid, allocation.id)
            .then(() => {
                mutate((data) => data?.filter((a) => a.id !== allocation.id), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setDeleteLoading(false));
    };

    return (
        <PageListItem>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-3 mb-3'>
                        <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                            <HugeIconsNetworkAntenna fill='currentColor' className='text-zinc-400 w-4 h-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-center flex-wrap gap-2'>
                                <CopyOnClick text={allocationString}>
                                    <div className='flex items-center gap-2 cursor-pointer hover:text-zinc-50 transition-colors group'>
                                        <h3 className='text-base font-medium text-zinc-100 font-mono truncate'>
                                            {allocation.alias ? allocation.alias : ip(allocation.ip)}:{allocation.port}
                                        </h3>
                                        <HugeIconsCopy
                                            fill='currentColor'
                                            className='w-3 h-3 text-zinc-500 group-hover:text-zinc-400 transition-colors'
                                        />
                                    </div>
                                </CopyOnClick>
                                {allocation.isDefault && (
                                    <span className='flex items-center gap-1 text-xs text-brand font-medium bg-brand/10 px-2 py-1 rounded'>
                                        <HugeIconsCrown fill='currentColor' className='w-3 h-3' />
                                        Primary
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section - Inline Editable */}
                    <div className='mt-3'>
                        <p className='text-xs text-zinc-500 uppercase tracking-wide mb-2'>Notes</p>

                        {isEditingNotes ? (
                            <div className='space-y-2'>
                                <InputSpinner visible={loading}>
                                    <Textarea
                                        ref={textareaRef}
                                        className='w-full bg-[#ffffff06] border border-[#ffffff08] rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 resize-none focus:ring-1 focus:ring-[#ffffff20] focus:border-[#ffffff20] transition-all'
                                        placeholder='Add notes for this allocation...'
                                        value={notesValue}
                                        onChange={(e) => setNotesValue(e.currentTarget.value)}
                                        rows={3}
                                    />
                                </InputSpinner>
                                <div className='flex items-center gap-2'>
                                    <ActionButton variant='primary' size='sm' onClick={saveNotes} disabled={loading}>
                                        {loading ? (
                                            <Spinner size='small' />
                                        ) : (
                                            <HugeIconsCheck fill='currentColor' className='w-3 h-3 mr-1' />
                                        )}
                                        Save
                                    </ActionButton>
                                    <ActionButton variant='secondary' size='sm' onClick={cancelEdit} disabled={loading}>
                                        <HugeIconsX fill='currentColor' className='w-3 h-3 mr-1' />
                                        Cancel
                                    </ActionButton>
                                </div>
                            </div>
                        ) : (
                            <Can action={'allocation.update'}>
                                <div
                                    className={`min-h-[2.5rem] p-3 rounded-lg border border-[#ffffff08] bg-[#ffffff03] cursor-pointer hover:border-[#ffffff15] transition-colors ${
                                        allocation.notes ? 'text-sm text-zinc-300' : 'text-sm text-zinc-500 italic'
                                    }`}
                                    onClick={startEdit}
                                >
                                    {allocation.notes || 'Click to add notes...'}
                                </div>
                            </Can>
                        )}
                    </div>
                </div>

                <div className='flex items-center justify-center gap-2 sm:flex-col sm:gap-3'>
                    <Can action={'allocation.update'}>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={setPrimaryAllocation}
                            disabled={allocation.isDefault}
                            title={
                                allocation.isDefault
                                    ? 'This is already the primary allocation'
                                    : 'Make this the primary allocation'
                            }
                        >
                            <HugeIconsCrown fill='currentColor' className='w-3 h-3 mr-1' />
                            <span className='hidden sm:inline'>Make Primary</span>
                            <span className='sm:hidden'>Primary</span>
                        </ActionButton>
                    </Can>
                    <Can action={'allocation.delete'}>
                        <ActionButton
                            variant='danger'
                            size='sm'
                            onClick={deleteAllocation}
                            disabled={allocation.isDefault || deleteLoading}
                            title={
                                allocation.isDefault ? 'Cannot delete the primary allocation' : 'Delete this allocation'
                            }
                        >
                            {deleteLoading ? (
                                <Spinner size='small' />
                            ) : (
                                <HugeIconsTrash fill='currentColor' className='w-3 h-3 mr-1' />
                            )}
                            <span className='hidden sm:inline'>Delete</span>
                        </ActionButton>
                    </Can>
                </div>
            </div>
        </PageListItem>
    );
};

export default memo(AllocationRow, isEqual);
