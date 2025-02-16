import { useEffect, useState } from 'react'
import { getActivityLogs } from "@/api/server/activity"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Terminal, FileText, Power, Activity } from "lucide-react"
import { motion } from "framer-motion"
import LogoLoader from '@/components/elements/ServerLoad'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActivityLogData {
  object: string
  attributes: {
    id: string
    event: string
    is_api: boolean
    ip: string
    properties: Record<string, any>
    timestamp: string
    relationships: {
      actor: {
        attributes: {
          username: string
          image: string
        }
      }
    }
  }
}

const getEventIcon = (event: string) => {
    if (event.includes('power')) return <Power className="w-4 h-4" />
    if (event.includes('file')) return <FileText className="w-4 h-4" />
    if (event.includes('console')) return <Terminal className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  

export const ActivityLogs = ({ serverId }: { serverId: string }) => {
    const [logs, setLogs] = useState<ActivityLogData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
  
    useEffect(() => {
      const fetchLogs = async () => {
        try {
          const data = await getActivityLogs(serverId)
          setLogs(data)
        } catch (err) {
          setError('Failed to fetch activity logs')
        } finally {
          setLoading(false)
        }
      }
  
      fetchLogs()
    }, [serverId])
  
    if (loading) {
    return <div className="flex justify-center items-center h-full p-4 animate-bounce">
      <LogoLoader size='1' className="w-7 h-7" />
    </div>
    }
  
    if (error) {
      return <div className="text-destructive p-4">{error}</div>
    }

  

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {logs?.map((log: ActivityLogData) => (
          <Card key={log.attributes.id}>
            <CardHeader className="p-4 flex-row items-center space-y-0 gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.attributes.relationships.actor.attributes.image} />
                <AvatarFallback>
                  {log.attributes.relationships.actor.attributes.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {log.attributes.relationships.actor.attributes.username}
                  </span>
                  <Badge variant="outline" className="h-5">
                    {getEventIcon(log.attributes.event)}
                    <span className="ml-1">{log.attributes.event.split('.').pop()}</span>
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                    {format(new Date(log.attributes.timestamp), 'PPp')} • 
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <motion.span 
                            whileHover={{ opacity: 1 }} 
                            initial={{ opacity: 0.1 }}
                          >
                            {log.attributes.ip}
                          </motion.span>
                        </TooltipTrigger>
                        <TooltipContent>IP Address</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
              </div>
            </CardHeader>
            {Object.keys(log.attributes.properties).length > 0 && (
              <CardContent className="pt-0 px-4 pb-4">
                <pre className="text-xs bg-muted p-2 rounded">
                  {JSON.stringify(log.attributes.properties, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}