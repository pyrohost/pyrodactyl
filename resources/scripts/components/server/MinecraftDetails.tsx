"use client"

import { useState, useEffect } from "react"
import { usePage } from "@inertiajs/react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { Server, Users, Wifi, WifiOff } from "lucide-react"
import type React from "react" // Added import for React

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
    // ...other server fields
  }
}

export default function MinecraftServerStatus() {
  const { props } = usePage<ServerProps>()
  const { server } = props
  const defaultAllocation = server.allocations.data.find((a) => a.is_default)

  const [isMcEnabled, setIsMcEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`mc-${server.uuid}`) === "true"
  })
  const [mcStatus, setMcStatus] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const toggleMcEnabled = () => {
    const newVal = !isMcEnabled
    setIsMcEnabled(newVal)
    localStorage.setItem(`mc-${server.uuid}`, newVal ? "true" : "false")
  }

  useEffect(() => {
    if (isMcEnabled && defaultAllocation) {
      const { ip_alias, port } = defaultAllocation
      const apiUrl = `https://api.mcsrvstat.us/2/${ip_alias}:${port}`
      setLoading(true)
      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          setMcStatus(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Failed to load MC server data", err)
          setError("Failed to load Minecraft server data")
          setLoading(false)
        })
    }
  }, [isMcEnabled, defaultAllocation])

  return (
    <Card className="w-full  mx-auto overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Minecraft Server Status</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">MC Server Mode</span>
            <Switch
              checked={isMcEnabled}
              onCheckedChange={toggleMcEnabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
        <AnimatePresence>
          {isMcEnabled && defaultAllocation && (
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
              {error && <p className="text-red-500 text-center py-4">{error}</p>}
              {mcStatus && (
                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                  <ServerInfoItem
                    icon={<Server className="w-5 h-5" />}
                    label="Hostname / IP"
                    value={mcStatus.hostname || defaultAllocation.ip_alias}
                  />
                  <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Port" value={mcStatus.port} />
                  <ServerInfoItem
                    icon={<Users className="w-5 h-5" />}
                    label="Players"
                    value={`${mcStatus.players?.online | 0} / ${mcStatus.players?.max | 0}`}
                  />
                  <ServerInfoItem icon={<Server className="w-5 h-5" />} label="Version" value={mcStatus.version} />
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
                      <ServerInfoItem
                        icon={<Server className="w-5 h-5" />}
                        label="MOTD"
                        value={mcStatus.motd.clean[0]}
                      />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {isMcEnabled && !defaultAllocation && (
          <p className="text-center text-red-500 py-4">No default allocation found for Minecraft.</p>
        )}
      </CardContent>
    </Card>
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
    <Card className="p-4 dark:bg-secondary/10 bg-zinc-100 ">
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

