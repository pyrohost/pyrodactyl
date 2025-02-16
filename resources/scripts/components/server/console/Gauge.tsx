import type React from "react"
import type { LucideIcon } from "lucide-react"

interface GaugeProps {
  value: number
  maxValue: number
  label: string
  icon: LucideIcon
}

const Gauge: React.FC<GaugeProps> = ({ value, maxValue, label, icon: Icon }) => {
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
            stroke="#fff"
            strokeWidth="8"
            strokeDasharray="126"
            strokeDashoffset={126 - (percentage / 100) * 126}
          />
          <g transform={`rotate(${angle}, 50, 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" stroke="#ff3e3e" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className="flex items-center mt-2">
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-sm">
        {label}: {Math.round(value)} %
        </span>
      </div>
    </div>
  )
}

export default Gauge

