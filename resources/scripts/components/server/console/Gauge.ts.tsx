"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"

interface GaugeProps {
  value: number
  maxValue: number
  label: string
  icon: LucideIcon
}

const Gauge: React.FC<GaugeProps> = ({ value, maxValue, label, icon: Icon }) => {
  const percentage = Math.min((value / maxValue) * 100, 100) // Ensure percentage doesn't exceed 100
  const angle = (percentage / 100) * 180 - 90

  // Color gradient based on percentage
  const getColor = (percent: number) => {
    if (percent < 50) return "#4ade80" // Green for low usage
    if (percent < 80) return "#facc15" // Yellow for medium usage
    return "#f87171" // Red for high usage
  }
  const gaugeColor = getColor(percentage)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Gauge background */}
          <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#333" strokeWidth="10" />
          {/* Gauge fill */}
          <path
            d="M10 50 A40 40 0 0 1 90 50"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="126"
            strokeDashoffset={126 - (percentage / 100) * 126}
          />
          {/* Needle */}
          <g transform={`rotate(${angle}, 50, 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" stroke="#fff" strokeWidth="2" />
            <circle cx="50" cy="50" r="3" fill="#fff" /> {/* Needle base */}
          </g>
          {/* Value text */}
          <text x="50" y="40" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            {Math.round(value)}
          </text>
        </svg>
      </div>
      <div className="flex items-center mt-2">
        <Icon className="w-4 h-4 mr-2" style={{ color: gaugeColor }} />
        <span className="text-sm font-semibold">
          {label}: {Math.round(value)}/{maxValue}
        </span>
      </div>
    </div>
  )
}

export default Gauge

