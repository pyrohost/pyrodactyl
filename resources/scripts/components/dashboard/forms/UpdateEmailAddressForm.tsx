import { useForm, usePage } from '@inertiajs/react';
import { Fragment, useEffect, useState } from 'react';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default () => {
    const { props } = usePage();
    const { auth, flash } = props;
    const { errors } = usePage().props as any;
    const [showError, setShowError] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        email: auth.user.email,
        password: '',
    });

    useEffect(() => {
        if (!processing && !flash.success && !flash.error) {
            setShowError(true);
        } else {
            setShowError(false);
        }
    }, [processing, flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowError(false);
        post('/api/inerstia/account/email', {
            preserveScroll: true,
            onSuccess: () => {
                setData('password', '');
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    return (
        <>
            {(flash.error || showError) && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {flash.error?.message || 'Something went wrong, Try again with the proper credentials.'}
                    </AlertDescription>
                </Alert>
            )}
            
            {flash.success && (
                <Alert className="mb-4 border-green-600 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                        {flash.success}
                    </AlertDescription>
                </Alert>
            )}

<Card>
                <CardContent>
                    <Fragment>
                        <SpinnerOverlay size={'large'} visible={processing} />
                        <form onSubmit={handleSubmit} className="m-0 space-y-6">
                            <div className="space-y-2 py-4">
                                <Label htmlFor="current_email ml-3">Email</Label>
                                <Input
                                    id="current_email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm_password">Confirm Password</Label>
                                <Input
                                    id="confirm_password"
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <Button 
                                type="submit"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Email'
                                )}
                            </Button>
                        </form>
                    </Fragment>
                </CardContent>
            </Card>
        </>
    );
};