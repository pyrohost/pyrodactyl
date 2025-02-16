"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"

interface GaugeProps {
  value: number
  maxValue: number
  label: string
  icon: LucideIcon
}

const Gauge: React.FC<GaugeProps> = ({ value, maxValue, label, icon: Icon }) => {
  const [animatedValue, setAnimatedValue] = useState(value)
  const [isRed, setIsRed] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    const prevValue = prevValueRef.current
    const difference = Math.abs(value - prevValue)
    const isRapidIncrease = difference > maxValue * 0.01 // 10% of maxValue

    if (isRapidIncrease) {
      setIsRed(true)
      setTimeout(() => setIsRed(false), 1000) // Reset color after 1 second
    }

    const animationDuration = 500 // ms
    const startTime = Date.now()

    const animateValue = () => {
      const elapsedTime = Date.now() - startTime
      const progress = Math.min(elapsedTime / animationDuration, 1)
      const easedProgress = easeOutCubic(progress)

      const newValue = prevValue + (value - prevValue) * easedProgress
      setAnimatedValue(newValue)

      if (progress < 1) {
        requestAnimationFrame(animateValue)
      }
    }

    animateValue()
    prevValueRef.current = value
  }, [value, maxValue])

  const percentage = (animatedValue / maxValue) * 100
  const angle = (percentage / 100) * 180 - 90

  const gaugeColor = isRed ? "#ff3e3e" : "#fff"

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#333" strokeWidth="10" />
          <path
            d="M10 50 A40 40 0 0 1 90 50"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="8"
            strokeDasharray="126"
            strokeDashoffset={126 - (percentage / 100) * 126}
          />
          <g transform={`rotate(${angle}, 50, 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" stroke={gaugeColor} strokeWidth="2" />
          </g>
        </svg>
      </div>
      <div className="flex items-center mt-2">
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-sm">
          {label}: {animatedValue}%
        </span>
      </div>
    </div>
  )
}

// Easing function for smoother animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export default Gauge

