import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import { array, object, string } from 'yup';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import HugeIconsCalendar from '@/components/elements/hugeicons/Calendar';
import HugeIconsCopy from '@/components/elements/hugeicons/Copy';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsFile from '@/components/elements/hugeicons/File';
import HugeIconsNetworkAntenna from '@/components/elements/hugeicons/NetworkAntenna';
import HugeIconsServer from '@/components/elements/hugeicons/Server';
import HugeIconsSettings from '@/components/elements/hugeicons/Settings';
import HugeIconsShield from '@/components/elements/hugeicons/Shield';
import HugeIconsUser from '@/components/elements/hugeicons/User';
import PermissionRow from '@/components/server/users/PermissionRow';

import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';

import { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import { Subuser } from '@/state/server/subusers';

import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import { usePermissions } from '@/plugins/usePermissions';

interface Values {
    email: string;
    permissions: string[];
}

interface Props {
    subuser?: Subuser;
    onSuccess: (subuser: Subuser) => void;
    onCancel: () => void;
    flashKey: string;
    isSubmitting?: boolean;
    setIsSubmitting?: (submitting: boolean) => void;
}

const UserFormComponent = ({ subuser, onSuccess, onCancel, flashKey, isSubmitting, setIsSubmitting }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    // The permissions that can be modified by this user.
    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`),
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = (values: Values) => {
        if (setIsSubmitting) setIsSubmitting(true);
        clearFlashes(flashKey);

        createOrUpdateSubuser(uuid, values, subuser)
            .then((subuser) => {
                appendSubuser(subuser);
                onSuccess(subuser);
            })
            .catch((error) => {
                console.error(error);
                if (setIsSubmitting) setIsSubmitting(false);
                clearAndAddHttpError({ key: flashKey, error });
            });
    };

    useEffect(
        () => () => {
            clearFlashes(flashKey);
        },
        [],
    );

    const getPermissionIcon = (key: string) => {
        switch (key) {
            case 'control':
                return HugeIconsServer;
            case 'user':
                return HugeIconsUser;
            case 'file':
                return HugeIconsFile;
            case 'backup':
                return HugeIconsCopy;
            case 'allocation':
                return HugeIconsNetworkAntenna;
            case 'startup':
                return HugeIconsSettings;
            case 'database':
                return HugeIconsDatabase;
            case 'schedule':
                return HugeIconsCalendar;
            default:
                return HugeIconsShield;
        }
    };

    return (
        <>
            <FlashMessageRender byKey={flashKey} />

            <Formik
                onSubmit={submit}
                initialValues={
                    {
                        email: subuser?.email || '',
                        permissions: subuser?.permissions || [],
                    } as Values
                }
                validationSchema={object().shape({
                    email: string()
                        .max(191, 'Email addresses must not exceed 191 characters.')
                        .email('A valid email address must be provided.')
                        .required('A valid email address must be provided.'),
                    permissions: array().of(string()),
                })}
            >
                {({ setFieldValue, values }) => (
                    <Form className='space-y-6'>
                        {/* User Information Section */}
                        {!subuser && (
                            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff12] rounded-xl p-6'>
                                <div className='flex items-center gap-3 mb-6'>
                                    <div className='w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center'>
                                        <HugeIconsUser fill='currentColor' className='w-5 h-5 text-brand' />
                                    </div>
                                    <h3 className='text-xl font-semibold text-zinc-100'>User Information</h3>
                                </div>
                                <Field
                                    name={'email'}
                                    label={'Email Address'}
                                    description={
                                        'Enter the email address of the user you wish to invite as a subuser for this server.'
                                    }
                                />
                            </div>
                        )}

                        {/* Permissions Section */}
                        <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border border-[#ffffff12] rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center'>
                                        <HugeIconsSettings fill='currentColor' className='w-5 h-5 text-brand' />
                                    </div>
                                    <h3 className='text-xl font-semibold text-zinc-100'>Detailed Permissions</h3>
                                </div>
                                {canEditUser && (
                                    <button
                                        type='button'
                                        onClick={() => {
                                            const allPermissions = editablePermissions;
                                            const allSelected = allPermissions.every((p) =>
                                                values.permissions.includes(p),
                                            );
                                            if (allSelected) {
                                                setFieldValue('permissions', []);
                                            } else {
                                                setFieldValue('permissions', [...allPermissions]);
                                            }
                                        }}
                                        className='text-sm px-4 py-2 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 hover:border-brand/30 transition-colors font-medium'
                                    >
                                        {editablePermissions.every((p) => values.permissions.includes(p))
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                )}
                            </div>

                            {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                <div className='mb-6 p-4 bg-brand/10 border border-brand/20 rounded-lg'>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <HugeIconsShield fill='currentColor' className='w-5 h-5 text-brand' />
                                        <span className='text-sm font-semibold text-brand'>Permission Restriction</span>
                                    </div>
                                    <p className='text-sm text-zinc-300 leading-relaxed'>
                                        You can only assign permissions that you currently have access to.
                                    </p>
                                </div>
                            )}

                            <div className='space-y-4'>
                                {Object.keys(permissions)
                                    .filter((key) => key !== 'websocket')
                                    .map((key) => (
                                        <div key={key} className='border border-[#ffffff12] rounded-lg p-4'>
                                            <div className='flex items-start justify-between mb-3'>
                                                <div className='flex items-start gap-3 flex-1 min-w-0'>
                                                    {(() => {
                                                        const Icon = getPermissionIcon(key);
                                                        return (
                                                            <Icon
                                                                fill='currentColor'
                                                                className='w-4 h-4 text-brand flex-shrink-0 mt-0.5'
                                                            />
                                                        );
                                                    })()}
                                                    <div className='flex-1 min-w-0'>
                                                        <h4 className='font-medium text-zinc-200 capitalize'>{key}</h4>
                                                        <p className='text-xs text-zinc-400 mt-1 break-words'>
                                                            {permissions[key]?.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                {canEditUser && (
                                                    <button
                                                        type='button'
                                                        onClick={() => {
                                                            const categoryPermissions = Object.keys(
                                                                permissions[key]?.keys ?? {},
                                                            ).map((pkey) => `${key}.${pkey}`);
                                                            const allSelected = categoryPermissions.every((p) =>
                                                                values.permissions.includes(p),
                                                            );
                                                            if (allSelected) {
                                                                setFieldValue(
                                                                    'permissions',
                                                                    values.permissions.filter(
                                                                        (p) => !categoryPermissions.includes(p),
                                                                    ),
                                                                );
                                                            } else {
                                                                const newPermissions = [...values.permissions];
                                                                categoryPermissions.forEach((p) => {
                                                                    if (
                                                                        !newPermissions.includes(p) &&
                                                                        editablePermissions.includes(p)
                                                                    ) {
                                                                        newPermissions.push(p);
                                                                    }
                                                                });
                                                                setFieldValue('permissions', newPermissions);
                                                            }
                                                        }}
                                                        className='text-xs px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors whitespace-nowrap flex-shrink-0'
                                                    >
                                                        {Object.keys(permissions[key]?.keys ?? {})
                                                            .map((pkey) => `${key}.${pkey}`)
                                                            .every((p) => values.permissions.includes(p))
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </button>
                                                )}
                                            </div>

                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                                {Object.keys(permissions[key]?.keys ?? {}).map((pkey) => (
                                                    <PermissionRow
                                                        key={`permission_${key}.${pkey}`}
                                                        permission={`${key}.${pkey}`}
                                                        disabled={
                                                            !canEditUser ||
                                                            editablePermissions.indexOf(`${key}.${pkey}`) < 0
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <Can action={subuser ? 'user.update' : 'user.create'}>
                            <div className='flex gap-3 justify-end pt-4 border-t border-[#ffffff12]'>
                                <ActionButton variant='secondary' type='button' onClick={onCancel}>
                                    Cancel
                                </ActionButton>
                                <ActionButton variant='primary' type='submit' disabled={isSubmitting}>
                                    {subuser ? 'Save Changes' : 'Invite User'}
                                </ActionButton>
                            </div>
                        </Can>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default UserFormComponent;
