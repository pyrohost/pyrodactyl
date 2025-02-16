"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { Cpu, HardDrive, MemoryStickIcon as Memory } from "lucide-react"

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

const Gauge: React.FC<{
  value: number
  maxValue: number
  label: string
  icon: React.ElementType
  color: string
}> = ({ value, maxValue, label, icon: Icon, color }) => {
  const percentage = (value / maxValue) * 100
  const angle = (percentage / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#333" strokeWidth="10" />
          <path
            d="M10 50 A40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="126"
            strokeDashoffset={126 - (percentage / 100) * 126}
          />
          <g transform={`rotate(${angle}, 50, 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" stroke="#fff" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className="flex items-center mt-2">
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-sm">
          {label}: {Math.round(value)}
          {label === "CPU" ? "%" : "MB"}
        </span>
      </div>
    </div>
  )
}

const ResourceUsage: React.FC = () => {
  const { server } = usePage().props as { server: Server }
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

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

  return (
    <div className="bg-black text-white p-8 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold mb-8 text-center">Resource Usage</h2>
      {error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <div className="relative w-64 h-32 overflow-hidden">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#333" strokeWidth="20" />
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#fff" strokeWidth="18" />
                <g transform={`rotate(${(cpuUsage / 100) * 270 - 135}, 100, 100)`}>
                  <line x1="100" y1="100" x2="100" y2="20" stroke="#ff3e3e" strokeWidth="3" />
                </g>
                <text x="100" y="85" textAnchor="middle" fontSize="24" fill="#fff">
                  {Math.round(cpuUsage)}%
                </text>
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <Gauge value={cpuUsage} maxValue={100} label="CPU" icon={Cpu} color="#ff3e3e" />
            <Gauge value={memoryUsage} maxValue={server.limits.memory} label="Memory" icon={Memory} color="#3e9fff" />
            <Gauge value={diskUsage} maxValue={server.limits.disk} label="Disk" icon={HardDrive} color="#3eff9f" />
          </div>
        </>
      )}
    </div>
  )
}

export default ResourceUsage

