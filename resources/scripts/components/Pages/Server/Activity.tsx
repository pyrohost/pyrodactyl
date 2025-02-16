import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ServerLayout from '@/components/Layouts/ServerLayout';
import PowerButtons from '@/components/server/console/PowerButtons';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import OverviewServerCard from '@/components/server/Overview';
import ServerSpecifications from '@/components/server/console/SystemSpecs';
import ResourceUsage, { ResourceUsageCards } from '@/components/server/console/ServerDetailsSpedo';
import { Toaster } from "@/components/ui/toaster"
import Console from '@/components/server/console/Console';
import CustomTerminal from '@/components/server/console/Console';
import MinecraftServerStatus from '@/components/server/ServerDetails_Intra';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ActivityLogs } from '@/components/dashboard/activity/ActivityLogContainer';


interface ServerPageProps {
    server: {
        uuid: string;
        name: string;
        identifier: string;
    }
}



export default function Show() {
    const { server, auth } = usePage<ServerPageProps>().props;
    const [serverStatus, setServerStatus] = useState<string | null>(null);
    const [isNodeOffline, setIsNodeOffline] = useState(false);
    console.log(server)

    useEffect(() => {
        const fetchStats = () => {
            getServerResourceUsage(server.uuid)
                .then(data => {
                    console.table(data);
                    setServerStatus(data.status);
                    setIsNodeOffline(false);
                })
                .catch(error => {
                    console.error(error);
                    setIsNodeOffline(true);
                });
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [server.uuid]);

    console.log(usePage<ServerPageProps>().props);

    //fixxses

    return (
        <ServerLayout 
            serverId={server.identifier}
            serverName={`Server / ${server.name} / Activity`}
            sidebarTab="activity"
        >
            <Head title={`${server.name} - Console`} />
            {/*<WebsocketHandler/>*/}
           
            
            
            <div className="p-4 space-y-4">
            <ActivityLogs serverId={server.identifier}/>
                
                
                
            </div>
        </ServerLayout>
    );
}