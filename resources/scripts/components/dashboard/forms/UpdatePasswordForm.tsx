import { useForm, usePage } from '@inertiajs/react';
import { Fragment } from 'react';
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
    
    const { data, setData, post, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/inerstia/account/password', {
            
            preserveScroll: true,
            onSuccess: () => {
                setData('current_password', '');
                setData('password', '');
                setData('password_confirmation', '');
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    return (
        <>
            {flash.error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {flash.error.message}
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
                            <div className="space-y-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={data.current_password}
                                    onChange={e => setData('current_password', e.target.value)}
                                    className={errors.current_password ? 'border-red-500' : ''}
                                />
                                {errors.current_password && (
                                    <p className="text-sm text-red-500">{errors.current_password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    className={errors.password_confirmation ? 'border-red-500' : ''}
                                />
                                {errors.password_confirmation && (
                                    <p className="text-sm text-red-500">{errors.password_confirmation}</p>
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
                                    'Update Password'
                                )}
                            </Button>
                        </form>
                    </Fragment>
                </CardContent>
            </Card>
        </>
    );
};