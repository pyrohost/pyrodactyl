import { usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, HardDrive, MemoryStickIcon as Memory, Activity, Server, Network, LucideNetwork } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CopyOnClick from '@/components/elements/CopyOnClick';

export interface ServerLimits {
    cpu: number;
    disk: number;
    io: number;
    ip_alias: string;
    memory: number;
    oom_disabled: boolean;
    swap: number;
    threads: number | null;
}

export interface SftpDetails {
    ip: string;
    port: number;
}

export interface Server {
    identifier: string;
    uuid: string;
    name: string;
    node: string;
    description: string;
    limits: ServerLimits;
    sftp_details: SftpDetails;
    allocations: {
        data: Allocation[];
    };
}


interface SpecItemProps {
    icon: React.ElementType;
    label: string;
    value: string;
    tooltip?: string;
    copyOnClick?: string;
  }
  
  const SpecItem = ({ icon: Icon, label, value, tooltip, copyOnClick }: SpecItemProps) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-3 p-4 bg-secondary/10 rounded-lg transition-colors hover:bg-secondary/20 shadow-lg">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {copyOnClick ? (
                <CopyOnClick text={copyOnClick}>
                  <p className="text-lg font-semibold">{value}</p>
                </CopyOnClick>
              ) : (
                <p className="text-lg font-semibold">{value}</p>
              )}
            </div>
          </div>
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );


const ServerSpecifications = () => {
    const { server } = usePage().props as { server: Server };

    const defaultAllocation = server.allocations.data.find(alloc => alloc.is_default);
    const connectionAddress = defaultAllocation 
        ? `${defaultAllocation.ip_alias}:${defaultAllocation.port}`
        : 'No connection address';

    console.log()

    return (
        <Card className="bg-background dark:bg-background shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    {server.name} Specifications
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SpecItem 
                        icon={Cpu} 
                        label="CPU Limit" 
                        value={`${server.limits.cpu}%`}
                        tooltip="Maximum CPU usage allowed"
                    />
                    <SpecItem 
                        icon={Memory} 
                        label="Memory" 
                        value={`${server.limits.memory} MB`}
                        tooltip="Allocated RAM"
                    />
                    <SpecItem 
                        icon={HardDrive} 
                        label="Disk Space" 
                        value={server.limits.disk === 0 ? 'Unlimited' : `${server.limits.disk} MB`}
                        tooltip="Available storage space"
                    />
                    <SpecItem 
                        icon={LucideNetwork} 
                        label="Connection Address" 
                        value={connectionAddress}
                        tooltip="Server connection address"
                    />
                </div>

                <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        SFTP Connection Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SpecItem 
                            icon={Server} 
                            label="Address" 
                            value={server.sftp_details.ip}
                            tooltip="SFTP server address"
                        />
                        <SpecItem 
                            icon={Network} 
                            label="Port" 
                            value={`${server.sftp_details.port}`}
                            tooltip="SFTP connection port"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ServerSpecifications;

