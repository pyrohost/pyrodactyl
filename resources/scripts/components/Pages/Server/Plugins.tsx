import { useState, useEffect, Suspense } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ServerLayout from '@/components/Layouts/ServerLayout';
import PowerButtons from '@/components/server/console/PowerButtons';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import OverviewServerCard from '@/components/server/Overview';
import ServerSpecifications from '@/components/server/console/SystemSpecs';
import ResourceUsage, { ResourceUsageCards } from '@/components/server/console/ServerDetailsSpedo';
import { Toaster } from "@/components/ui/toaster"
import MinecraftDetails from '@/components/server/ServerDetails_Intra';
import MinecraftServerStatus from '@/components/server/ServerDetails_Intra';
import CustomTerminal from '@/components/server/console/Console';
import installPlugin from '@/api/server/plugins/installPlugin';
import getPlugins from '@/api/server/plugins/getPlugins';
import ViewPlugins from '@/components/server/Plugins/viewPlugins';


interface ServerPageProps {
    server: {
        uuid: string;
        name: string;
        identifier: string;
    }
}





  // Get initial plugins data
  

export default function Show() {
    const { server, auth } = usePage<ServerPageProps>().props;
    const [serverStatus, setServerStatus] = useState<string | null>(null);
    const [isNodeOffline, setIsNodeOffline] = useState(false);
    const initialPlugins = getPlugins(server.uuid, "minecraft")

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

    const [loading, setLoading] = useState(false);

    

    console.log(usePage<ServerPageProps>().props);

    //fixxses

    return (
        <ServerLayout 
            serverId={server.identifier}
            serverName={`Server / ${server.name}/ Plugins`}
            sidebarTab="plugins"
        >
            <Head title={`${server.name} - Plugins`} />
           
            
            
            <div className="p-4 space-y-4">
                <PowerButtons 
                    serverId={server.uuid}
                    status={serverStatus}
                    disabled={isNodeOffline}
                    className="mb-4" 
                />
                <OverviewServerCard serverId={server.uuid}/>
                <ViewPlugins serverUuid={server.uuid} />
                
                

                

                {/*stop from random debounce errors, methodically load it */}
                <Suspense>
                   <ResourceUsage/>
                </Suspense>


               

                <MinecraftServerStatus/>
            </div>
        </ServerLayout>
    );
}