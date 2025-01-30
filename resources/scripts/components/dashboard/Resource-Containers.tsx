"use client"

import React, { useState } from "react"
import { usePage } from "@inertiajs/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Cpu, MemoryStick, HardDrive, Server, LayoutGrid, List, BarChart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ListView = ({ type, resources, limits, percentage }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <type.icon className="w-5 h-5" />
        <span className="font-medium">{type.label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm tabular-nums">
          {resources[type.key]}
          {type.unit}
        </span>
        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}

const ChartView = ({ type, resources, limits, percentage }) => {
  return (
    <Card className="p-4 border-0 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <type.icon className="w-5 h-5" />
          <span className="font-medium">{type.label}</span>
        </div>
        <span className="text-lg font-semibold tabular-nums">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-24 flex items-end bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <motion.div
          className={`w-full ${type.color} rounded-t`}
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span>
          {resources[type.key]}
          {type.unit}
        </span>
        <span>
          {limits[type.key]}
          {type.unit}
        </span>
      </div>
    </Card>
  )
}

const CardView = ({ type, index, resources, limits, percentage, formattedPercentage }) => {
  return (
    <Card className="relative w-full overflow-hidden border-0 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl">
      <div className={`absolute inset-0 bg-white dark:bg-gradient-to-br ${type.color} opacity-20`} />
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl dark:bg-white/10 bg-black backdrop-blur-md">
              <BarChart className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium dark:text-white/90 text-black">{type.label}</CardTitle>
          </div>
          <motion.span
            className="text-2xl font-semibold dark:text-white tabular-nums tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {formattedPercentage}%
          </motion.span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          <div className="relative h-2 overflow-hidden rounded-full bg-black/25 dark:bg-white/[0.08]">
            <motion.div
              className="absolute h-full rounded-full bg-black dark:bg-white/25 backdrop-blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-black dark:text-white/60 tabular-nums">
              {resources[type.key]} {type.unit}
            </span>
            <span className="text-sm dark:text-white/60 tabular-nums">
              {limits[type.key]} {type.unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ResourceView = () => {
  const [viewType, setViewType] = useState("cards")
  const { auth } = usePage().props
  const { limits, resources } = auth.user
  console.log(auth.user)

  const resourceTypes = [
    { key: "cpu", label: "CPU", unit: "%", icon: Cpu, color: "from-blue-500 to-blue-700" },
    { key: "memory", label: "Memory", unit: "MB", icon: MemoryStick, color: "from-purple-500 to-purple-700" },
    { key: "disk", label: "Disk", unit: "MB", icon: HardDrive, color: "from-rose-500 to-rose-700" },
    { key: "servers", label: "Servers", unit: "", icon: Server, color: "from-orange-500 to-orange-700" },
  ]

  const viewComponents = {
    cards: CardView,
    list: ListView,
    chart: ChartView,
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={viewType} onValueChange={setViewType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span>Cards</span>
              </div>
            </SelectItem>
            <SelectItem value="list">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                <span>List</span>
              </div>
            </SelectItem>
            <SelectItem value="chart">
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                <span>Chart</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={viewType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`
            ${viewType === "cards" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : ""}
            ${viewType === "list" ? "border rounded-lg divide-y" : ""}
            ${viewType === "chart" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : ""}
          `}
        >
          {resourceTypes.map((type, index) => {
            const percentage = (resources[type.key] / limits[type.key]) * 100
            const ViewComponent = viewComponents[viewType]
            return (
              <motion.div
                key={type.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ViewComponent
                  type={type}
                  index={index}
                  resources={resources}
                  limits={limits}
                  percentage={percentage}
                  formattedPercentage={percentage.toFixed(0)}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ResourceView

