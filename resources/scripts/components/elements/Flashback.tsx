import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// ...existing interfaces...


interface FlashbackTesterProps {
    className?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    auth: {
        user: User;
    };
    flash?: {
        message?: string;
        type?: 'success' | 'error' | 'warning';
    };
}

export default function FlashbackTester({ className = '' }: FlashbackTesterProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [flashMessage, setFlashMessage] = useState<string | null>(null);
    const { post, processing } = useForm();

    const fetchServers = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        post('/api/inerstia/account/test', {
            onSuccess: (page) => {
                if (page.props.flash) {
                    setFlashMessage(page.props.flash.status || '');
                } else {
                    console.error('No servers found in the response');
                }
            },
            onError: (error) => {
                console.error('Failed to send request:', error);
            },
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Test inertia</CardTitle>
                <CardDescription>
                    Click the button below to fetch testing inertia.
                </CardDescription>
            </CardHeader>
            <CardContent>
                

                {flashMessage && (
                    <div className="mt-0 p-4 bg-green-100 dark:bg-zinc-900 text-green-800 dark:text-green-200 rounded">
                        <p>Message: {flashMessage}</p>
                    </div>
                )}
                <Button 
                    onClick={fetchServers} 
                    disabled={processing}
                    className='mt-4'
                >
                    Test inertia
                </Button>
            </CardContent>
        </Card>
    );
}