import { useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import { Button } from '@/components/elements/button/index';

import { ServerContext } from '@/state/server';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [visible, setVisible] = useState(false);

    return (
        <>
            {({ isSubmitting, resetForm }) => (
                <Modal
                    visible={visible}
                    dismissable={!isSubmitting}
                    showSpinnerOverlay={isSubmitting}
                    onDismissed={() => {
                        resetForm();
                        setVisible(false);
                    }}
                    title='Create new database'
                >
                    <div className='flex flex-col'>
                        <FlashMessageRender byKey={'database:create'} />
                        <Form>
                            <Field
                                type={'string'}
                                id={'database_name'}
                                name={'databaseName'}
                                label={'Database Name'}
                                description={'A descriptive name for your database instance.'}
                            />
                            <div className={`mt-6`}>
                                <Field
                                    type={'string'}
                                    id={'connections_from'}
                                    name={'connectionsFrom'}
                                    label={'Connections From'}
                                    description={
                                        'Where connections should be allowed from. Leave blank to allow connections from anywhere.'
                                    }
                                />
                            </div>
                            <div className={`flex gap-3 justify-end my-6`}>
                                <Button type={'submit'}>Create Database</Button>
                            </div>
                        </Form>
                    </div>
                </Modal>
            )}

            <button
                style={{
                    background:
                        'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
                }}
                className='px-8 py-3 border-[1px] border-[#ffffff12] rounded-full text-sm font-bold shadow-md'
                onClick={() => setVisible(true)}
            >
                New Database
            </button>
        </>
    );
};
