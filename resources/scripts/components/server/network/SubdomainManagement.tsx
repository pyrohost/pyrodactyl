import { Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as yup from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import HugeIconsLink from '@/components/elements/hugeicons/Link';

import {
    SubdomainInfo,
    checkSubdomainAvailability,
    deleteSubdomain,
    getSubdomainInfo,
    setSubdomain,
} from '@/api/server/network/subdomain';

import { ServerContext } from '@/state/server';

import { useFlashKey } from '@/plugins/useFlash';

interface AvailableDomain {
    id: number;
    name: string;
    is_active: boolean;
    is_default: boolean;
}

interface SubdomainFormValues {
    subdomain: string;
    domain_id: string;
}

const CleanInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => (
        <input
            ref={ref}
            className={`border-0 bg-transparent focus:ring-0 outline-none text-white placeholder-zinc-400 ${className}`}
            {...props}
        />
    ),
);
CleanInput.displayName = 'CleanInput';

const CleanSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = '', children, ...props }, ref) => (
        <select
            ref={ref}
            className={`border-0 bg-transparent focus:ring-0 outline-none text-zinc-300 ${className}`}
            {...props}
        >
            {children}
        </select>
    ),
);
CleanSelect.displayName = 'CleanSelect';

const validationSchema = yup.object().shape({
    subdomain: yup
        .string()
        .required('A subdomain name is required.')
        .min(1, 'Subdomain must be at least 1 character.')
        .max(63, 'Subdomain cannot exceed 63 characters.')
        .matches(
            /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i,
            'Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.',
        ),
    domain_id: yup.string().required('A domain must be selected.'),
});

const SubdomainManagement = () => {
    const [loading, setLoading] = useState(false);
    const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        checked: boolean;
        available: boolean;
        message: string;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network:subdomain');

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadSubdomainInfo();
    }, []);

    const loadSubdomainInfo = async () => {
        try {
            clearFlashes();
            const data = await getSubdomainInfo(uuid);
            setSubdomainInfo(data);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        }
    };

    const checkAvailability = useCallback(
        async (subdomain: string, domainId: string) => {
            if (!subdomain?.trim() || !domainId) {
                setAvailabilityStatus(null);
                return;
            }

            // Don't check availability for current subdomain unless domain changed
            if (
                subdomainInfo?.current_subdomain &&
                subdomainInfo.current_subdomain.attributes.subdomain === subdomain.trim() &&
                subdomainInfo.current_subdomain.attributes.domain_id.toString() === domainId
            ) {
                setAvailabilityStatus(null);
                return;
            }

            try {
                setCheckingAvailability(true);
                const response = await checkSubdomainAvailability(uuid, subdomain.trim(), parseInt(domainId));
                setAvailabilityStatus({
                    checked: true,
                    available: response.available,
                    message: response.message,
                });
            } catch (error) {
                setAvailabilityStatus({
                    checked: true,
                    available: false,
                    message: 'Failed to check availability. Please try again.',
                });
            } finally {
                setCheckingAvailability(false);
            }
        },
        [uuid, subdomainInfo?.current_subdomain],
    );

    const debouncedCheckAvailability = useCallback(
        (subdomain: string, domainId: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                checkAvailability(subdomain, domainId);
            }, 500);
        },
        [checkAvailability],
    );

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleSetSubdomain = async (
        values: SubdomainFormValues,
        { setSubmitting, resetForm }: FormikHelpers<SubdomainFormValues>,
    ) => {
        try {
            clearFlashes();
            setLoading(true);
            await setSubdomain(uuid, values.subdomain.trim(), parseInt(values.domain_id));
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
            if (isEditing) {
                setIsEditing(false);
            } else {
                resetForm();
            }
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleDeleteSubdomain = async () => {
        if (
            !confirm(
                'Are you sure you want to delete this subdomain? This will remove all associated DNS records and cannot be undone.',
            )
        ) {
            return;
        }

        try {
            clearFlashes();
            setLoading(true);
            await deleteSubdomain(uuid);
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    if (!subdomainInfo) {
        return (
            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
                <div className='flex items-center justify-center py-12'>
                    <div className='flex flex-col items-center gap-3'>
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-brand'></div>
                        <p className='text-sm text-neutral-400'>Loading subdomain configuration...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!subdomainInfo?.supported) {
        return null; // Don't show anything if subdomains aren't supported
    }

    if (!subdomainInfo?.available_domains || subdomainInfo.available_domains.length === 0) {
        return (
            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
                <div className='flex items-center justify-between mb-6'>
                    <h3 className='text-xl font-extrabold tracking-tight'>Subdomain Management</h3>
                </div>
                <div className='flex flex-col items-center justify-center py-12'>
                    <div className='text-center'>
                        <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <svg className='w-6 h-6 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path
                                    fillRule='evenodd'
                                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <h4 className='text-md font-medium text-zinc-200 mb-1'>No domains configured</h4>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            Contact your administrator to configure subdomain support for this server.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-6 shadow-sm'>
            <div className='flex items-center gap-3 mb-6'>
                <HugeIconsLink className='w-6 h-6 text-zinc-400' fill='currentColor' />
                <h3 className='text-xl font-extrabold tracking-tight'>Subdomain Management</h3>
                {subdomainInfo?.current_subdomain && (
                    <div className='flex items-center gap-2 text-sm ml-auto'>
                        <div
                            className={`w-2 h-2 rounded-full ${subdomainInfo.current_subdomain.attributes.is_active ? 'bg-green-400' : 'bg-red-400'}`}
                        ></div>
                        <span
                            className={
                                subdomainInfo.current_subdomain.attributes.is_active ? 'text-green-400' : 'text-red-400'
                            }
                        >
                            {subdomainInfo.current_subdomain.attributes.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            <FlashMessageRender byKey={'server:network:subdomain'} />

            {subdomainInfo?.current_subdomain && !isEditing ? (
                /* Current Subdomain Display Mode */
                <div className='space-y-4'>
                    <div className='bg-[#ffffff08] border border-[#ffffff15] rounded-lg p-4'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-zinc-400 mb-2'>Current Subdomain</p>
                                <p className='text-lg font-medium text-white font-mono'>
                                    {subdomainInfo?.current_subdomain?.attributes?.full_domain}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff15]'>
                        <ActionButton
                            type='button'
                            variant='danger'
                            onClick={handleDeleteSubdomain}
                            disabled={loading}
                            size='sm'
                        >
                            {loading ? 'Deleting...' : 'Delete Subdomain'}
                        </ActionButton>
                        <ActionButton
                            type='button'
                            variant='primary'
                            onClick={() => setIsEditing(true)}
                            disabled={loading}
                            size='sm'
                        >
                            Edit Subdomain
                        </ActionButton>
                    </div>
                </div>
            ) : (
                /* Form Mode (Create or Edit) */
                <Formik
                    initialValues={{
                        subdomain: subdomainInfo?.current_subdomain?.attributes?.subdomain || '',
                        domain_id:
                            subdomainInfo?.current_subdomain?.attributes?.domain_id?.toString() ||
                            (subdomainInfo?.available_domains as AvailableDomain[])
                                ?.find((d) => d.is_default)
                                ?.id.toString() ||
                            subdomainInfo?.available_domains?.[0]?.id.toString() ||
                            '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSetSubdomain}
                    enableReinitialize
                >
                    {({ values, setFieldValue, isSubmitting, isValid, errors, resetForm }) => (
                        <Form className='space-y-6'>
                            <div className='space-y-4'>
                                <FormikFieldWrapper
                                    name='subdomain'
                                    label='Subdomain'
                                    description='Choose a unique name for your subdomain. Only lowercase letters, numbers, and hyphens are allowed.'
                                >
                                    <div className='flex items-center border border-[#ffffff15] overflow-hidden hover:border-[#ffffff25] transition-colors'>
                                        <Field
                                            as={CleanInput}
                                            name='subdomain'
                                            placeholder='myserver'
                                            className='flex-1 px-4 py-3'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                setFieldValue('subdomain', value);
                                                if (values.domain_id && value.trim()) {
                                                    debouncedCheckAvailability(value, values.domain_id);
                                                } else {
                                                    setAvailabilityStatus(null);
                                                    if (debounceTimeoutRef.current) {
                                                        clearTimeout(debounceTimeoutRef.current);
                                                    }
                                                }
                                            }}
                                        />
                                        <div className='border-l border-[#ffffff15]'>
                                            <Field
                                                as={CleanSelect}
                                                name='domain_id'
                                                className='min-w-[140px] px-4 py-3'
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const value = e.target.value;
                                                    setFieldValue('domain_id', value);
                                                    if (values.subdomain?.trim()) {
                                                        debouncedCheckAvailability(values.subdomain, value);
                                                    }
                                                }}
                                            >
                                                {(subdomainInfo?.available_domains as AvailableDomain[])?.map(
                                                    (domain) => (
                                                        <option key={domain.id} value={domain.id}>
                                                            .{domain.name}
                                                        </option>
                                                    ),
                                                ) || []}
                                            </Field>
                                        </div>
                                    </div>
                                </FormikFieldWrapper>

                                {/* Availability Status */}
                                {(checkingAvailability || availabilityStatus) && (
                                    <div
                                        className={`rounded-lg p-4 border ${checkingAvailability ? 'bg-blue-500/10 border-blue-500/20' : availabilityStatus?.available ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                                    >
                                        {checkingAvailability ? (
                                            <div className='flex items-center text-sm text-blue-300'>
                                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3'></div>
                                                Checking availability...
                                            </div>
                                        ) : (
                                            availabilityStatus && (
                                                <div
                                                    className={`text-sm flex items-center font-medium ${availabilityStatus.available ? 'text-green-300' : 'text-red-300'}`}
                                                >
                                                    <div
                                                        className={`w-3 h-3 rounded-full mr-3 ${availabilityStatus.available ? 'bg-green-400' : 'bg-red-400'}`}
                                                    ></div>
                                                    {availabilityStatus.message}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className='flex items-center justify-end gap-3 pt-6 border-t border-[#ffffff15]'>
                                {isEditing ? (
                                    <>
                                        <ActionButton
                                            type='button'
                                            variant='secondary'
                                            size='sm'
                                            onClick={() => {
                                                setIsEditing(false);
                                                resetForm();
                                                setAvailabilityStatus(null);
                                            }}
                                            disabled={isSubmitting || loading}
                                        >
                                            Cancel
                                        </ActionButton>
                                        <ActionButton
                                            type='submit'
                                            variant='primary'
                                            size='sm'
                                            disabled={
                                                isSubmitting ||
                                                loading ||
                                                !isValid ||
                                                !values.subdomain.trim() ||
                                                !values.domain_id ||
                                                (availabilityStatus?.checked && !availabilityStatus?.available)
                                            }
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </ActionButton>
                                    </>
                                ) : (
                                    <ActionButton
                                        type='submit'
                                        variant='primary'
                                        size='sm'
                                        disabled={
                                            isSubmitting ||
                                            loading ||
                                            !isValid ||
                                            !values.subdomain.trim() ||
                                            !values.domain_id ||
                                            (availabilityStatus?.checked && !availabilityStatus?.available)
                                        }
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Subdomain'}
                                    </ActionButton>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
};

export default SubdomainManagement;
