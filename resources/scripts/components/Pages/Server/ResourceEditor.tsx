import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import ResourceCard from '../Common/ResourceEdit.card';
import ServerManagementLayout from '@/components/Layouts/ServerLayout';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
  } from "@/components/ui/alert-dialog"
import { LucideAlertCircle, LucideChartArea, LucideCheckCircle } from 'lucide-react';


interface Server {
    identifier: string;
    uuidShort: string;
    name: string;
    memory: number;
    disk: number;
    cpu: number;
    allocation_limit: number;
    database_limit: number;
    backup_limit: number;
}

interface ServerPageProps {
    server: Server;
    flash: any;
    
}

interface AvailableResources {
    memory: number;
    disk: number;
    cpu: number;
    allocations: number;
    databases: number;
    backups: number;
}

interface ResourceEditorProps {
    server: Server;
    availableResources: AvailableResources;
}

interface FormData {
    memory: number;
    disk: number;
    cpu: number;
    allocation_limit: number;
    database_limit: number;
    backup_limit: number;
}

export default function ResourceEditor({availableResources }: ResourceEditorProps) {
    const { server} = usePage<ServerPageProps>().props;
    console.log(server)
    
    const { data, setData, put, processing, errors } = useForm<FormData>({
        memory: server.memory,
        disk: server.disk,
        cpu: server.cpu,
        allocation_limit: server.allocation_limit,
        database_limit: server.database_limit,
        backup_limit: server.backup_limit
    });

    const { flash } = usePage<ServerPageProps>().props
    const [showError, setShowError] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false);
    

    useEffect(() => {
        if (flash.error) {
          setShowError(true)
        }
      }, [flash.error])
    
      useEffect(() => {
        if (flash.success) {
          setShowSuccess(true)
        }
      }, [flash.error])
    
    

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.cpu <= 0 || data.memory <= 0 || data.disk <= 0) {
            toast.error('CPU, Memory and Disk cannot be zero');
            return;
        }
        put(`/server/${server.uuidShort}/resources`);
    };

    return (

        <>
        <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent className="max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <LucideCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
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

    
        <ServerManagementLayout
            serverId={server.uuidShort}
            serverName={`Server / ${server.name} / Resources`}
            sidebarTab="resources"
        >
            <div className="p-4 space-y-4">
                <ResourceCard
                   
                    values={data}
                    onChange={(key: keyof FormData, value: number) => setData(key, value)}
                    onSubmit={onSubmit}
                    availableResources={availableResources}
                    errors={errors}
                    isProcessing={processing}
                />
            </div>
        </ServerManagementLayout>
        </>
    );
}