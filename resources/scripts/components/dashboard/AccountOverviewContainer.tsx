import { usePage } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Code from '../elements/Code';
import FlashbackTester from '../elements/Flashback';
import AccountSSHContainer from './ssh/AccountSSHContainer';
import { ManageApiKeys } from './Apikeys';

export default () => {
    const { props } = usePage();
    const { auth, companyDesc, AppConfig } = props;
    //console.log(props.AppConfig)
    const Appver = AppConfig.appVer;





    return (
        <PageContentBlock title={'Your Settings'}>
            

            

            <div className='flex flex-col w-full h-full gap-4'>
                <h2 className='mt-8 font-extrabold text-2xl ml-2'>Account Information</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Update your Email Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UpdateEmailAddressForm />
                    </CardContent>
                </Card>
                
                <h2 className='mt-8 font-extrabold ml-2 text-2xl'>Password and Authentication</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>
                

                <h2 className='mt-8 ml-2 font-extrabold text-2xl'>App Information </h2>

                
                
                
                <Card className='max-w-3xl '>
                    <CardHeader>
                        <CardTitle>Build Version</CardTitle>
                        <CardDescription>Below is useful information for debugging</CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4 '>
                        <Code className='dark:bg-zinc-800 bg-zinc-200 '>Based on {Appver}</Code>
                        <Code className='dark:bg-zinc-800 bg-zinc-200'>Pastel Beta December 2024</Code>
                        
                        
                    </CardContent>
                </Card>

                <ManageApiKeys/>

                

                <FlashbackTester className='max-w-3xl'/>
            </div>
        </PageContentBlock>
    );
};