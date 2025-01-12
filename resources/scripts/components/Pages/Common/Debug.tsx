import { usePage } from '@inertiajs/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Bug } from 'lucide-react';
import { toast } from 'sonner';

export default function DebugInfo() {
    const { server } = usePage().props as { 
        server: { 
            uuid: string;
            node: string;
            invocation: string;
            docker_image: string;
        } 
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Debug Information
                </CardTitle>
                <CardDescription>
                    Technical details about your server
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Server UUID:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {server.uuid}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.uuid, 'UUID')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Node:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {server.node}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.node, 'Node')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Docker Image:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                    {server.docker_image}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.docker_image, 'Docker Image')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Invocation:</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                    {server.invocation}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => copyToClipboard(server.invocation, 'Invocation')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}