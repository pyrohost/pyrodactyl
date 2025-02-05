import { useForm, usePage, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { LucideAlertCircle, LucideCheckCircle2 } from 'lucide-react'
import ManagePlans from './user.plans'

interface PageProps {
    auth: any;
    companyDesc: string;
    user: UserFormProps['user'];
    flash: {
        error?: string;
        success?: {
            title?: string;
            desc?: string;
        };
    };
}

interface UserFormProps {
    user: {
        id: number;
        username: string;
        email: string;
        name_first: string;
        name_last: string;
        language: string;
        root_admin: boolean;
        coins?: string;
        limits: ResourceLimits;
        resources: ResourceLimits;
    }
}

interface ResourceLimits {
    cpu: number;
    memory: number;
    disk: number;
    allocations: number;
    backups: number;
    servers: number;
    databases: number;
}

const defaultValues: ResourceLimits = {
    cpu: 0,
    memory: 0,
    disk: 0,
    allocations: 0,
    backups: 0,
    servers: 0,
    databases: 0
}

export default function UserForm() {
    const { props } = usePage<PageProps>();
    const { auth, companyDesc, user } = props;
    const { flash } = usePage<PageProps>().props
    const [showError, setShowError] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        username: user?.username || '',
        email: user?.email || '',
        name_first: user?.name_first || '',
        name_last: user?.name_last || '',
        language: user?.language || 'en',
        root_admin: user?.root_admin || false,
        password: '',
        password_confirmation: '',
        coins: user?.coins || '',
        limits: { ...defaultValues, ...user?.limits },
        resources: { ...defaultValues, ...user?.resources }
    })
    



    useEffect(() => {
        if (flash.error) {
            setShowError(true)
        }
    }, [flash.error])
    
    useEffect(() => {
        if (flash.success) {
            setShowSuccess(true)
        }
    }, [flash.success]) // Fixed dependency

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Basic validation
        if (!data.username || !data.email) {
            toast.error('Username and email are required')
            return
        }

        if (data.password && data.password !== data.password_confirmation) {
            toast.error('Passwords do not match')
            return
        }

        patch(`/admin/users/view/${user.id}`, {
            onSuccess: () => toast.success('User updated successfully'),
            onError: (errors) => toast.error(errors.error || 'Failed to edit user'),
            preserveScroll: true
        })
    }

    const handleDelete = () => {
        router.delete(`/admin/users/view/${user.id}`, {
            onSuccess: () => {
                toast.success('User deleted successfully')
                window.location.href = '/admin/users'
            },
            onError: (errors) => toast.error(errors.error || 'Failed to delete user')
        })
    }

    const updateResource = (type: 'resources' | 'limits', key: keyof ResourceLimits, value: string) => {
        const numValue = parseFloat(value) || 0
        setData(type, { ...data[type], [key]: numValue })
    }

    // Rest of the JSX remains the same, but with one fix for the Coins label:

    

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            
            <Card>
                <CardHeader>
                    <CardTitle>User Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Username</label>
                            <Input 
                                value={data.username}
                                onChange={e => setData('username', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input 
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <Input 
                                value={data.name_first}
                                onChange={e => setData('name_first', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <Input 
                                value={data.name_last}
                                onChange={e => setData('name_last', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Coins</label>
                            <Input 
                                value={data.coins}
                                onChange={e => setData('coins', e.target.value)}
                            />
                        </div>
                    </div>
                    

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Password (optional)</label>
                            <Input 
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <Input 
                                type="password"
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="root_admin"
                            checked={data.root_admin}
                            onCheckedChange={(checked) => setData('root_admin', checked)}
                        />
                        <Label htmlFor="root_admin">Administrator Account</Label>
                    </div>
                </CardContent>
            </Card>

            

            {/* Resources Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Resources & Limits (Only in resource Spilliting mode)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-medium mb-4">Current Resources</h4>
                            {Object.entries(data.resources).map(([key, value]) => (
                                <div key={key} className="mb-4">
                                    <label className="block text-sm font-medium mb-2 capitalize">
                                        {key}
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step={key === 'cpu' ? '0.1' : '1'}
                                        value={value}
                                        onChange={(e) => updateResource('resources', key as keyof ResourceLimits, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div>
                            <h4 className="font-medium mb-4">Resource Limits</h4>
                            {Object.entries(data.limits).map(([key, value]) => (
                                <div key={key} className="mb-4">
                                    <label className="block text-sm font-medium mb-2 capitalize">
                                        {key} Limit
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step={key === 'cpu' ? '1' : '1'}
                                        value={value}
                                        onChange={(e) => updateResource('limits', key as keyof ResourceLimits, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                Delete User
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user
                                    and all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            <AlertDialog open={showError}  onOpenChange={setShowError}>
        <AlertDialogContent className="max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <LucideAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">Error during transaction</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base">{flash.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>





<AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent className="max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <LucideCheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {flash?.success?.title || 'Success'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            {flash?.success?.desc || 'Operation completed successfully'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}