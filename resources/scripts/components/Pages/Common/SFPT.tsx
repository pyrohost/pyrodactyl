import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Server } from 'lucide-react';
import { toast } from 'sonner'; //replace with shadcn toast soon 

export default function SFTPDetails() {
    const { server } = usePage().props as { 
        server: { 
            sftp_details: { 
                ip: string;
                port: number;
            }
        } 
    };
    const [showPassword, setShowPassword] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    SFTP Connection Details
                </CardTitle>
                <CardDescription>
                    Access your server files via SFTP
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Host:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-background px-2 py-1 rounded">
                                    {server.sftp_details.ip}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.sftp_details.ip, 'Host')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Port:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-background px-2 py-1 rounded">
                                    {server.sftp_details.port}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.sftp_details.port.toString(), 'Port')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Password:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-background px-2 py-1 rounded">
                                    {showPassword ? 'Use account password' : '••••••••••'}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                    Use your account password to connect via SFTP
                </p>
            </CardContent>
        </Card>
    );
}