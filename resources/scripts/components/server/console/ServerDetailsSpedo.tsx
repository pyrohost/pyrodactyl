

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { Cpu, HardDrive, MemoryStickIcon as Memory } from "lucide-react"
import Gauge from "./Gauge"
import { Button } from "@/components/ui/button"
import { LayoutGrid, PieChart } from "lucide-react"

interface ServerStats {
  object: string
  attributes: {
    current_state: string
    is_suspended: boolean
    resources: {
      cpu_absolute: number
      disk_bytes: number
      memory_bytes: number
      network_rx_bytes: number
      network_tx_bytes: number
      uptime: number
    }
  }
}

interface Server {
  identifier: string
  limits: {
    cpu: number
    memory: number
    disk: number
  }
}

interface DisplayPreference {
  type: 'gauge' | 'card'
}

// Add new CardView component
const CardView: React.FC<{
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  server: Server
}> = ({ cpuUsage, memoryUsage, diskUsage, server }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-lg bg-black/20 backdrop-blur">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5" />
          <span>CPU</span>
        </div>
        <div className="text-2xl font-bold">{Math.round(cpuUsage)}%</div>
      </div>
      <div className="p-4 rounded-lg bg-black/20 backdrop-blur">
        <div className="flex items-center gap-2 mb-2">
          <Memory className="w-5 h-5" />
          <span>Memory</span>
        </div>
        <div className="text-2xl font-bold">{Math.round(memoryUsage)} MB</div>
      </div>
      <div className="p-4 rounded-lg bg-black/20 backdrop-blur">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-5 h-5" />
          <span>Disk</span>
        </div>
        <div className="text-2xl font-bold">{Math.round(diskUsage)} MB</div>
      </div>
    </div>
  )
}



const ResourceUsage: React.FC = () => {
  const { server } = usePage().props as { server: Server }
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const [displayType, setDisplayType] = useState<DisplayPreference['type']>('gauge')
  
  // Check localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('resourceDisplayType_ryx_us')
    if (savedPreference) {
      setDisplayType(savedPreference as DisplayPreference['type'])
    }
  }, [])

  // Save preference when changed
  const toggleDisplay = () => {
    const newType = displayType === 'gauge' ? 'card' : 'gauge'
    setDisplayType(newType)
    localStorage.setItem('resourceDisplayType_ryx_us', newType)
  }

  useEffect(() => {
    const setupEventSource = () => {
      eventSourceRef.current = new EventSource(`/api/client/servers/${server.identifier}/resources/stream`)

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setStats(data)
          setError(null)
        } catch (err) {
          console.error("Error parsing stats:", err)
          setError("Failed to parse server stats")
        }
      }

      eventSourceRef.current.onerror = () => {
        setError("Connection lost")
        eventSourceRef.current?.close()
        setTimeout(setupEventSource, 5000)
      }
    }

    setupEventSource()

    return () => {
      eventSourceRef.current?.close()
    }
  }, [server.identifier])

  const cpuUsage = stats ? stats.attributes.resources.cpu_absolute : 0
  const memoryUsage = stats ? stats.attributes.resources.memory_bytes / (1024 * 1024) : 0
  const diskUsage = stats ? stats.attributes.resources.disk_bytes / (1024 * 1024) : 0

  const MainGauge: React.FC<{ value: number }> = ({ value }) => {
    // Constrain angle between -135 and 135 degrees
    const angle = Math.max(-135, Math.min(135, -135 + (value / 100) * 270))
    const gaugeColor = value > 80 ? "#ef4444" : "#ec4899"
    const accentColor = "#f472b6"
    const backgroundColor = "#18181b"
  
    return (
      <div className="relative w-64 h-40 overflow-hidden">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background */}
          <rect x="0" y="0" width="200" height="120" fill={backgroundColor} rx="10" />
          
          {/* Base gauge arc - flatter design */}
          <path 
            d="M20 100 A80 80 0 0 1 180 100" 
            fill="none" 
            stroke="#27272a" 
            strokeWidth="12"
            strokeLinecap="round" 
          />
          
          {/* Value gauge arc - flatter design */}
          <path
            d="M20 100 A80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="376"
            strokeDashoffset={376 - (value / 100) * 376}
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
          
          {/* Needle with constrained rotation */}
          <g 
            transform={`rotate(${angle}, 100, 100)`}
            style={{ transition: 'transform 0.3s ease-out' }}
          >
            <line 
              x1="100" 
              y1="100" 
              x2="100" 
              y2="35" 
              stroke={accentColor} 
              strokeWidth="2.5"
              strokeLinecap="round" 
            />
            <circle 
              cx="100" 
              cy="100" 
              r="4" 
              fill={accentColor} 
            />
          </g>
          
          {/* Percentage text */}
          <text 
            x="100" 
            y="90" 
            textAnchor="middle" 
            fontSize="20" 
            fill={accentColor} 
            fontWeight="500"
            className="font-mono"
          >
            {Math.round(value)}%
          </text>
        </svg>
      </div>
    )
  }

  return (
    <div className="dark:bg-black bg-zinc-200 text-white p-8 rounded-lg shadow-2xl">
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDisplay}
          className="hover:bg-white/10"
        >
          {displayType === 'gauge' ? (
            <LayoutGrid className="w-5 h-5" />
          ) : (
            <PieChart className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
          {displayType === 'gauge' ? (
            <div className="grid grid-cols-3 gap-8">
              <Gauge value={cpuUsage} maxValue={100} label="CPU" icon={Cpu} color="#ff3e3e" />
              <Gauge value={memoryUsage} maxValue={server.limits.memory} label="Memory" icon={Memory} color="#3e9fff" />
              <Gauge value={diskUsage} maxValue={server.limits.disk} label="Disk" icon={HardDrive} color="#3eff9f" />
            </div>
          ) : (
            <CardView 
              cpuUsage={cpuUsage}
              memoryUsage={memoryUsage}
              diskUsage={diskUsage}
              server={server}
            />
          )}
        </>
      )}
    </div>
  )
}

export default ResourceUsage

