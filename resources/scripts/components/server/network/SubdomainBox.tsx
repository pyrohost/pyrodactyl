import React, { useState, useCallback } from 'react';
import { Actions, useStoreActions } from 'easy-peasy';
import { Form, Formik, useFormikContext } from 'formik';
import { toast } from 'sonner';
import { object, string, number } from 'yup';
import useSWR from 'swr';

import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import ConnectedDropdownField from '@/components/elements/ConnectedDropdownField';
import { PageListItem } from '@/components/elements/pages/PageList';
import HugeIconsLink from '@/components/elements/hugeicons/Link';

import { httpErrorToHuman } from '@/api/http';
import {
    getSubdomainInfo,
    setSubdomain,
    updateSubdomain,
    removeSubdomain,
    checkSubdomainAvailability,
    syncSubdomainDns,
    SubdomainInfo,
    SetSubdomainRequest,
    AvailabilityResponse,
} from '@/api/server/subdomain';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    subdomain: string;
    domain_id: number;
}

interface AvailabilityState {
    available: boolean;
    message: string;
}

const SubdomainFormFields = ({
    subdomainInfo,
    onAvailabilityCheck,
}: {
    subdomainInfo: SubdomainInfo;
    onAvailabilityCheck: (subdomain: string, domainId: number) => void;
}) => {
    const { values, setFieldValue } = useFormikContext<Values>();

    const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setFieldValue('subdomain', value);
        if (value && values.domain_id) {
            onAvailabilityCheck(value, values.domain_id);
        }
    };

    const handleDomainChange = (domainId: number): void => {
        setFieldValue('domain_id', domainId);
        if (values.subdomain && domainId) {
            onAvailabilityCheck(values.subdomain, domainId);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <ConnectedDropdownField
                    id="subdomain"
                    name="subdomain"
                    label="Subdomain Configuration"
                    placeholder="myserver"
                    description="Letters, numbers, and hyphens only"
                    options={subdomainInfo.available_domains}
                    selectedOptionId={values.domain_id}
                    onOptionChange={handleDomainChange}
                    onInputChange={handleSubdomainChange}
                />
            </div>
        </div>
    );
};

const SubdomainViewMode = ({
    subdomainInfo,
    onEdit,
    onRemove,
    onSync,
}: {
    subdomainInfo: SubdomainInfo;
    onEdit: () => void;
    onRemove: () => void;
    onSync: () => void;
}) => {
    return (
        <PageListItem>
            <div className='flex flex-col gap-4 w-full'>
                <div className='flex items-center gap-3 mb-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                        <HugeIconsLink fill='currentColor' className='text-zinc-400 w-4 h-4' />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h3 className='text-base font-medium text-zinc-100'>Subdomain Configuration</h3>
                        <p className='text-sm text-zinc-400'>
                            {subdomainInfo.attributes.subdomain
                                ? 'Your server subdomain configuration'
                                : 'Configure a custom subdomain for your server'
                            }
                        </p>
                    </div>
                </div>

                {subdomainInfo.attributes.subdomain ? (
                    <div className="space-y-3">
                        <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-lg">
                            <div>
                                <Label className="text-xs text-zinc-400 uppercase tracking-wide">Configured Domain</Label>
                                <p className="text-zinc-100 font-medium text-lg">{subdomainInfo.attributes.full_domain}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <ActionButton variant="secondary" onClick={onSync} type="button" size="sm">
                                Sync DNS
                            </ActionButton>
                            <ActionButton variant="danger" onClick={onRemove} type="button" size="sm">
                                Remove
                            </ActionButton>
                            <ActionButton variant="primary" onClick={onEdit} type="button" size="sm">
                                Edit
                            </ActionButton>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-zinc-400 mb-4">No subdomain configured</p>
                        <ActionButton variant="primary" onClick={onEdit} type="button" size="sm">
                            Configure Subdomain
                        </ActionButton>
                    </div>
                )}
            </div>
        </PageListItem>
    );
};

const SubdomainForm = ({
    subdomainInfo,
    onCancel,
    onRemove,
    onSync,
}: {
    subdomainInfo: SubdomainInfo;
    onCancel: () => void;
    onRemove: () => void;
    onSync: () => void;
}) => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const [availability, setAvailability] = useState<AvailabilityState | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);

    const checkAvailability = useCallback(async (subdomain: string, domainId: number): Promise<void> => {
        if (!subdomain || !domainId || subdomain.length < 1) {
            setAvailability(null);
            return;
        }

        setIsCheckingAvailability(true);
        try {
            const result: AvailabilityResponse = await checkSubdomainAvailability(server.uuid, subdomain, domainId);
            setAvailability({
                available: result.available,
                message: result.available
                    ? `${result.full_domain} is available!`
                    : `${result.full_domain} is already taken`,
            });
        } catch (error) {
            console.error('Error checking subdomain availability:', error);
            setAvailability({
                available: false,
                message: 'Error checking availability',
            });
        } finally {
            setIsCheckingAvailability(false);
        }
    }, [server.uuid]);

    // Debounced version of checkAvailability
    const debouncedCheckAvailability = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (subdomain: string, domainId: number) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    checkAvailability(subdomain, domainId);
                }, 500); // 500ms debounce
            };
        })(),
        [checkAvailability]
    );

    return (
        <PageListItem>
            <div className='flex flex-col gap-4 w-full'>
                <div className='flex items-center gap-3 mb-3'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                        <HugeIconsLink fill='currentColor' className='text-zinc-400 w-4 h-4' />
                    </div>
                    <div className='min-w-0 flex-1'>
                        <h3 className='text-base font-medium text-zinc-100'>Subdomain Configuration</h3>
                        <p className='text-sm text-zinc-400'>Configure a custom subdomain for your server</p>
                    </div>
                </div>

                <Form className="flex flex-col gap-4">
                    <SubdomainFormFields
                        subdomainInfo={subdomainInfo}
                        onAvailabilityCheck={debouncedCheckAvailability}
                    />

                    {availability && (
                        <div className={`p-3 rounded-lg border ${availability.available ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <p className={`text-sm ${availability.available ? 'text-green-400' : 'text-red-400'}`}>
                                {isCheckingAvailability ? 'Checking availability...' : availability.message}
                            </p>
                        </div>
                    )}

                    {subdomainInfo.attributes.subdomain && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                            <p className="text-sm text-blue-400">
                                <strong>Current:</strong> {subdomainInfo.attributes.full_domain}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2 justify-end">
                        <ActionButton variant="secondary" onClick={onCancel} type="button" size="sm">
                            Cancel
                        </ActionButton>
                        <ActionButton variant="primary" type="submit" size="sm">
                            {subdomainInfo.attributes.subdomain ? 'Update' : 'Configure'}
                        </ActionButton>
                    </div>
                </Form>
            </div>
        </PageListItem>
    );
};

const SubdomainBox: React.FC = () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const { data: subdomainInfo, error, mutate } = useSWR<SubdomainInfo>(
        `subdomain:${server.uuid}`,
        () => getSubdomainInfo(server.uuid)
    );

    const submit = async (values: Values): Promise<void> => {
        if (!subdomainInfo) return;

        clearFlashes('server:network');
        toast('Updating subdomain configuration...');

        try {
            // Since subdomain_type is now optional, we can omit it and let the backend choose the default
            const requestData: SetSubdomainRequest = {
                subdomain: values.subdomain,
                domain_id: values.domain_id,
            };

            if (subdomainInfo.attributes.subdomain) {
                await updateSubdomain(server.uuid, requestData);
            } else {
                await setSubdomain(server.uuid, requestData);
            }
            
            await mutate();
            setIsEditing(false);
            toast.success('Subdomain updated successfully!');
        } catch (error) {
            console.error('Error updating subdomain:', error);
            addError({ key: 'server:network', message: httpErrorToHuman(error) });
        }
    };

    const handleRemove = async (): Promise<void> => {
        if (!window.confirm('Are you sure you want to remove the subdomain? This will delete all DNS records.')) {
            return;
        }

        clearFlashes('server:network');
        toast('Removing subdomain...');

        try {
            await removeSubdomain(server.uuid);
            await mutate();
            setIsEditing(false);
            toast.success('Subdomain removed successfully!');
        } catch (error) {
            console.error('Error removing subdomain:', error);
            addError({ key: 'server:network', message: httpErrorToHuman(error) });
        }
    };

    const handleSync = async (): Promise<void> => {
        clearFlashes('server:network');
        toast('Syncing DNS records...');

        try {
            await syncSubdomainDns(server.uuid);
            toast.success('DNS records synchronized!');
        } catch (error) {
            console.error('Error syncing DNS records:', error);
            addError({ key: 'server:network', message: httpErrorToHuman(error) });
        }
    };

    if (error) {
        return (
            <PageListItem>
                <div className='flex items-center justify-center p-8'>
                    <p className='text-red-400'>Failed to load subdomain information</p>
                </div>
            </PageListItem>
        );
    }

    if (!subdomainInfo) {
        return (
            <PageListItem>
                <div className='flex items-center justify-center p-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </PageListItem>
        );
    }

    const initialValues: Values = {
        subdomain: subdomainInfo.attributes.subdomain || '',
        domain_id: subdomainInfo.available_domains.find((d) => d.name === subdomainInfo.attributes.domain)?.id ||
                  (subdomainInfo.available_domains.length > 0 ? subdomainInfo.available_domains[0]?.id || 0 : 0),
    };

    if (!isEditing) {
        return (
            <SubdomainViewMode
                subdomainInfo={subdomainInfo}
                onEdit={() => setIsEditing(true)}
                onRemove={handleRemove}
                onSync={handleSync}
            />
        );
    }

    return (
        <Formik
            onSubmit={submit}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={object().shape({
                subdomain: string()
                    .required('Subdomain is required')
                    .min(1, 'Subdomain must be at least 1 character')
                    .max(63, 'Subdomain cannot exceed 63 characters')
                    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/, 'Invalid subdomain format'),
                domain_id: number().required('Domain is required').min(1, 'Please select a domain'),
            })}
        >
            <SubdomainForm
                subdomainInfo={subdomainInfo}
                onCancel={() => setIsEditing(false)}
                onRemove={handleRemove}
                onSync={handleSync}
            />
        </Formik>
    );
};

export default SubdomainBox;