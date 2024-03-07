import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Settings'}>
            <div className={'flex flex-row justify-between items-center mb-8'}>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem]'>Settings</h1>
            </div>
            <FlashMessageRender byKey={'settings'} className={`mb-4`} />
            {/* <Can action={'settings.rename'}>
                    <div className={`mb-6 md:mb-10`}>
                        <RenameServerBox />
                    </div>
                </Can> */}
            <div className='w-full h-full flex flex-col gap-8'>
                <Can action={'settings.reinstall'}>
                    <ReinstallServerBox />
                </Can>
                <TitledGreyBox title={'Debug Information'}>
                    <div className={`flex items-center justify-between text-sm`}>
                        <p>Node</p>
                        <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>{node}</code>
                    </div>
                    <CopyOnClick text={uuid}>
                        <div className={`flex items-center justify-between mt-2 text-sm`}>
                            <p>Server ID</p>
                            <code className={`font-mono bg-zinc-900 rounded py-1 px-2`}>{uuid}</code>
                        </div>
                    </CopyOnClick>
                </TitledGreyBox>
                <Can action={'file.sftp'}>
                    <TitledGreyBox title={'SFTP Details'} className={`mb-6 md:mb-10`}>
                        <div>
                            <Label>Server Address</Label>
                            <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                <div>{`sftp://${ip(sftp.ip)}:${sftp.port}`}</div>
                            </CopyOnClick>
                        </div>
                        <div className={`mt-6`}>
                            <Label>Username</Label>
                            <CopyOnClick text={`${username}.${id}`}>
                                <div>{`${username}.${id}`}</div>
                            </CopyOnClick>
                        </div>
                        <div className={`mt-6 flex items-center`}>
                            <div className={`flex-1`}>
                                <div className={`border-l-4 border-blue-500 p-3`}>
                                    <p className={`text-xs text-zinc-200`}>
                                        Your SFTP password is the same as the password you use to access this panel.
                                    </p>
                                </div>
                            </div>
                            <div className={`ml-4`}>
                                <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                    <Button.Text variant={Button.Variants.Secondary}>Launch SFTP</Button.Text>
                                </a>
                            </div>
                        </div>
                    </TitledGreyBox>
                </Can>
            </div>
        </ServerContentBlock>
    );
};
