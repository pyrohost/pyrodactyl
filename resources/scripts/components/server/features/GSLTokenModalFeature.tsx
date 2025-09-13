import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import { SocketEvent, SocketRequest } from '@/components/server/events';

import updateStartupVariable from '@/api/server/updateStartupVariable';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

interface Values {
    gslToken: string;
}

const GSLTokenModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['(gsl token expired)', '(account not found)'];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    const updateGSLToken = (values: Values) => {
        setLoading(true);
        clearFlashes('feature:gslToken');

        updateStartupVariable(uuid, 'STEAM_ACC', values.gslToken)
            .then(() => {
                if (instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }

                setLoading(false);
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:gslToken', error });
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:gslToken');
    }, []);

    return (
        <Formik onSubmit={updateGSLToken} initialValues={{ gslToken: '' }}>
            <Modal
                visible={visible}
                onDismissed={() => setVisible(false)}
                closeOnBackground={false}
                showSpinnerOverlay={loading}
                title='Invalid GSL token!'
            >
                <FlashMessageRender key={'feature:gslToken'} />
                <Form>
                    <p>It seems like your Gameserver Login Token (GSL token) is invalid or has expired.</p>
                    <p className={`mt-3`}>
                        You can either generate a new one and enter it below or leave the field blank to remove it
                        completely.
                    </p>
                    <div className={`sm:flex items-center mt-6`}>
                        <Field
                            name={'gslToken'}
                            label={'GSL Token'}
                            description={'Visit https://steamcommunity.com/dev/managegameservers to generate a token.'}
                            autoFocus
                        />
                    </div>
                    <div className={`my-6 sm:flex items-center justify-end`}>
                        <ActionButton variant='primary' type={'submit'}>
                            Update GSL Token
                        </ActionButton>
                    </div>
                </Form>
            </Modal>
        </Formik>
    );
};

export default GSLTokenModalFeature;
