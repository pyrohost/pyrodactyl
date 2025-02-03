"use client"

import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { Server, Users, Wifi, WifiOff, Globe, Code, Database, LucideUpload } from "lucide-react"
import type React from "react"
import { useMinecraftStatus } from "@/api/server/minecraft/getMinecraftStatus"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "../ui/button"
import getFileUploadUrl from "@/api/server/files/getFileUploadUrl"
import { toast } from 'sonner';


interface Allocation {
  id: number
  ip: string
  ip_alias: string
  port: number
  notes: string | null
  is_default: boolean
}

interface ServerProps {
  server: {
    uuid: string
    allocations: {
      data: Allocation[]
    }
    docker_image: string
    // ...other server fields
  }
}

type ServerType = "minecraft" | "webapp" | "other"

export default function ServerStatus() {
  const { props } = usePage<ServerProps>()
  const { server } = props
  const defaultAllocation = server.allocations.data.find((a) => a.is_default)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [serverType, setServerType] = useState<ServerType>(() => {
    return (localStorage.getItem(`serverType-${server.uuid}`) as ServerType) || "other"
  })

  const [isStatusEnabled, setIsStatusEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`status-${server.uuid}`) === "true"
  })

  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem(`serverType-${server.uuid}`, serverType)
  }, [serverType, server.uuid])

  const toggleStatusEnabled = () => {
    const newVal = !isStatusEnabled
    setIsStatusEnabled(newVal)
    localStorage.setItem(`status-${server.uuid}`, newVal ? "true" : "false")
  }

  const { mcStatus, isLoading, error } = useMinecraftStatus(
    defaultAllocation?.ip_alias || "",
    defaultAllocation?.port || 0,
    isStatusEnabled && serverType === "minecraft",
  )


  //Upload a minecraft icon

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.includes('image/png')) {
      setUploadError('Server icon must be a PNG file');
      return;
    }

    // Create temp image to check dimensions
    const img = new Image();
    const imgPromise = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    try {
      const loadedImg = await imgPromise as HTMLImageElement;
      if (loadedImg.width !== 64 || loadedImg.height !== 64) {
        setUploadError('Server icon must be 64x64 pixels');
        return;
      }

      setUploading(true);
      setUploadError(null);

      // Get upload URL for the root directory
      const uploadUrl = await getFileUploadUrl(server.uuid, '/');

      const formData = new FormData();
      formData.append('files', file, 'server-icon.png');

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      toast.success('Server icon uploaded successfully! Server restart may be required.');
    } catch (error) {
      console.error('Error uploading server icon:', error);
      setUploadError('Failed to upload server icon. Please try again.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(img.src);
    }
};

  const isJavaContainer = server.docker_image.toLowerCase().includes("java")
  const isWebAppContainer =
    server.docker_image.toLowerCase().includes("python") || server.docker_image.toLowerCase().includes("node") || server.docker_image.toLowerCase().includes("ubuntu") || server.docker_image.toLowerCase().includes("alpine") || server.docker_image.toLowerCase().includes("debian") 

  return (
    <Card className="w-full mx-auto overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Server Status</h2>
          <div className="flex items-center space-x-4">
            <Select value={serverType} onValueChange={(value: ServerType) => setServerType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select server type" />
              </SelectTrigger>
              <SelectContent>
                {isJavaContainer && <SelectItem value="minecraft">Minecraft Server</SelectItem>}
                {isWebAppContainer && <SelectItem value="webapp">Web App (Python/JS)</SelectItem>}
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Enable Status</span>
              <Switch
                checked={isStatusEnabled}
                onCheckedChange={toggleStatusEnabled}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Server Icon</h3>
          <div className="flex items-center space-x-2">
            <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" ref={fileInputRef} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline">
              <LucideUpload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Icon"}
            </Button>
            {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          </div>
        </div>
        <AnimatePresence>
          {isStatusEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {serverType === "minecraft" && (
                <MinecraftStatus mcStatus={mcStatus} error={error} defaultAllocation={defaultAllocation} />
              )}
              {serverType === "webapp" && <WebAppStatus defaultAllocation={defaultAllocation} />}
              {serverType === "other" && <OtherStatus defaultAllocation={defaultAllocation} />}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

interface MinecraftStatusProps {
  mcStatus: any
  error: string | null
  defaultAllocation: Allocation | undefined
}

function MinecraftStatus({ mcStatus, error, defaultAllocation }: MinecraftStatusProps) {
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>
  if (!mcStatus) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
      <ServerInfoItem
        icon={<Server className="w-5 h-5" />}
        label="Hostname / IP"
        value={mcStatus.hostname || defaultAllocation?.ip_alias || ""}
      />
      <ServerInfoItem
        icon={<Server className="w-5 h-5" />}
        label="Port"
        value={mcStatus.port || defaultAllocation?.port || ""}
      />
      <ServerInfoItem
        icon={<Users className="w-5 h-5" />}
        label="Players"
        value={`${mcStatus.players?.online || 0} / ${mcStatus.players?.max || 0}`}
      />
      <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Version" value={mcStatus.version || "Unknown"} />
      <div className="col-span-2">
        <ServerInfoItem
          icon={mcStatus.online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          label="Status"
          value={mcStatus.online ? "Online" : "Offline"}
          className={mcStatus.online ? "text-green-500" : "text-red-500"}
        />
      </div>
      {mcStatus.motd?.clean?.[0] && (
        <div className="col-span-2">
          <ServerInfoItem icon={<Server className="w-5 h-5" />} label="MOTD" value={mcStatus.motd.clean[0]} />
        </div>
      )}
    </div>
  )
}

interface WebAppStatusProps {
  defaultAllocation: Allocation | undefined
}

function WebAppStatus({ defaultAllocation }: WebAppStatusProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      <ServerInfoItem
        icon={<Globe className="w-5 h-5" />}
        label="Web Server"
        value="Running"
        className="text-green-500"
      />
      <ServerInfoItem icon={<Code className="w-5 h-5" />} label="Language" value="Python/JavaScript" />
      <ServerInfoItem
        icon={<Server className="w-5 h-5" />}
        label="Hostname / IP"
        value={defaultAllocation?.ip_alias || "N/A"}
      />
      <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Port" value={defaultAllocation?.port || "N/A"} />
      <div className="col-span-2">
        <ServerInfoItem
          icon={<Database className="w-5 h-5" />}
          label="Database"
          value="Available"
          className="text-green-500"
        />
      </div>
    </div>
  )
}

interface OtherStatusProps {
  defaultAllocation: Allocation | undefined
}

function OtherStatus({ defaultAllocation }: OtherStatusProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Server Type" value="Custom" />
      <ServerInfoItem
        icon={<Server className="w-5 h-5" />}
        label="Hostname / IP"
        value={defaultAllocation?.ip_alias || "N/A"}
      />
      <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Port" value={defaultAllocation?.port || "N/A"} />
      <div className="col-span-2">
        <ServerInfoItem icon={<Wifi className="w-5 h-5" />} label="Status" value="Running" className="text-green-500" />
      </div>
    </div>
  )
}

interface ServerInfoItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  className?: string
}

function ServerInfoItem({ icon, label, value, className }: ServerInfoItemProps) {
  return (
    <Card className="p-4 dark:bg-secondary/10 bg-zinc-100">
      <CardContent className="flex items-center space-x-3">
        <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`font-medium ${className}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

