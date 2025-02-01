import type React from "react"
import { useEffect, useState } from "react"
import { useForm, usePage } from "@inertiajs/react"
import ResourceCard from "../Common/ResourceEdit.card"
import ServerManagementLayout from "@/components/Layouts/ServerLayout"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { LucideAlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ServerPageProps {
  server: {
    uuidShort: string
    memory: number
    disk: number
    cpu: number
    allocation_limit: number
    database_limit: number
    backup_limit: number
  }
  flash: {
    success?: {
      title?: string
      desc: string
    }
    error?: string
  }
}

interface FormData {
  memory: number
  disk: number
  cpu: number
  allocation_limit: number
  database_limit: number
  backup_limit: number
}

interface ResourceEditorProps {
  availableResources: any[]
}

export default function ResourceEditor({ availableResources }: ResourceEditorProps) {
  const { server } = usePage<ServerPageProps>().props
  const { flash } = usePage<ServerPageProps>().props
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const { data, setData, put, processing, errors } = useForm<FormData>({
    memory: server.memory,
    disk: server.disk,
    cpu: server.cpu,
    allocation_limit: server.allocation_limit,
    database_limit: server.database_limit,
    backup_limit: server.backup_limit,
  })

  useEffect(() => {
    if (flash.success) {
      toast({
        title: flash.success.title || "Success",
        description: flash.success.desc,
        variant: "default",
      })
    }
    if (flash.error) {
      setShowError(true)
      toast({
        title: "Error",
        description: flash.error,
        variant: "destructive",
      })
    }
  }, [flash, toast])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.cpu <= 0 || data.memory <= 0 || data.disk <= 0) {
      toast({
        title: "Error",
        description: "CPU, Memory and Disk cannot be zero",
        variant: "destructive",
      })
      return
    }
    put(`/server/${server.uuidShort}/resources`)
  }

  return (
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
  )
}

