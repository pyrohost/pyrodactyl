import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw } from 'lucide-react';

const ReinstallButton = () => {
    const { server } = usePage().props as { server: { uuid: string } };
    const [isLoading, setIsLoading] = useState(false);

    const handleReinstall = async () => {
        try {
            setIsLoading(true);
            await axios.post(`/api/client/servers/${server.uuid}/settings/reinstall`);
            window.location.reload();
        } catch (error) {
            console.error('Failed to reinstall server:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-start items-center">
            <Card className="">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Server Reinstallation</CardTitle>
                <CardDescription>
                Reinstall your server to its default state
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                <img 
                    src="/assets/svgs/remake.svg"
                    alt="Create New"
                    className="w-120 h-60 object-contain"
                />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                This will reinstall your server to its original state. 
                All data in RAM will be lost during this process.
                </p>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full max-w-xs">
                    Reinstall Server
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will reinstall your server. All data in RAM will be lost.
                    </AlertDialogDescription>

                    </AlertDialogHeader>
                    <img 
                    src="/assets/svgs/remake.svg"
                    alt="Create New"
                    className="w-120 h-60 object-contain"
                />
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReinstall}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Reinstalling...
                        </>
                        ) : (
                        'Yes, reinstall'
                        )}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardContent>
            </Card>
        </div>
    );
};

export default ReinstallButton;