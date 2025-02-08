"use client"

import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { useForm } from "@inertiajs/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LucideCreditCard, LucideGift, ChevronLeft, ChevronRight, LucideServer } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  plan: {
    id: number
    name: string
    description: string
    cpu: number
    memory: number
    disk: number
    databases: number
    backups: number
    allocations: number
    servers: number
    price: number
    isTrial: boolean
    image: string | null
  }
  limits: {
    cpu: number
    memory: number
    disk: number
    servers: number
    allocations: number
    databases: number
    backups: number
  }
  locations: {
    id: number
    short: string
    long: string
    flag_url: string | null
  }[]
  eggs: {
    id: number
    name: string
    description: string
    image_url: string
    nest_id: number
  }[]
}

export default function Create() {
  const { plan, limits, locations, eggs } = usePage<Props>().props
  const [selectedEgg, setSelectedEgg] = useState<Props["eggs"][0] | null>(null)
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const planFeatures = [
    { value: plan.cpu, label: "CPU", unit: "%", icon: "⚡" },
    { value: plan.memory, label: "Memory", unit: "MB", icon: "💾" },
    { value: plan.disk, label: "Disk", unit: "MB", icon: "💿" },
    { value: plan.databases, label: "Databases", unit: "", icon: "🗄️" },
    { value: plan.backups, label: "Backups", unit: "", icon: "📦" },
    { value: plan.allocations, label: "Allocations", unit: "", icon: "🔌" },
  ]

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlanIndex((prev) => (prev === planFeatures.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [planFeatures.length])

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: currentPlanIndex * 200,
        behavior: "smooth",
      })
    }
  }, [currentPlanIndex])

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    egg_id: "",
    nest_id: "",
    location_id: locations[0]?.id || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post("/api/inerstia/servers/create")
  }

  const isValid = data.name && data.egg_id && data.location_id

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Deploy Your Server</h1>
              <p className="text-lg text-muted-foreground">Powerful infrastructure at your fingertips</p>
            </div>

            <Card className="overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="grid gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Server Name</label>
                    <Input
                      value={data.name}
                      onChange={(e) => setData("name", e.target.value)}
                      error={errors.name}
                      placeholder="Enter server name"
                      className="h-12 text-lg"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold">Select Location</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <AnimatePresence>
                        {locations.map((location) => (
                          <motion.div
                            key={location.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Card
                                    className={cn(
                                      "cursor-pointer transition-all duration-300",
                                      data.location_id === location.id
                                        ? "ring-2 ring-primary shadow-lg"
                                        : "hover:shadow-md",
                                    )}
                                    onClick={() => setData("location_id", location.id)}
                                  >
                                    <CardContent className="p-6 flex flex-col items-center">
                                      {location.image && (
                                        <img
                                          src={location.image || "/placeholder.svg"}
                                          alt={location.short}
                                          className="w-16 h-16 object-cover rounded-lg mb-3 bg-background"
                                        />
                                      )}
                                      <p className="font-medium">{location.short}</p>
                                    </CardContent>
                                  </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{location.long}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                    <div className="space-y-4 z-1">
                    <h3 className="text-2xl font-semibold">Select Template</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {eggs.map((egg) => (
                      <motion.div key={egg.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                        <Card
                        className={cn(
                          "cursor-pointer transition-all duration-300 relative overflow-hidden min-h-[200px]",
                          data.egg_id === egg.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md",
                        )}
                        onClick={() => {
                          setData("egg_id", egg.id)
                          setData("nest_id", egg.nest_id)
                        }}
                        >
                        {egg.image_url && (
                          <div
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${egg.image_url || "/placeholder.svg"})` }}
                          >
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                          </div>
                        )}
                        <CardContent className="p-6 flex flex-col items-center relative z-4">
                          <LucideServer className="w-8 h-8 text-white mb-3" />
                          <p className="font-medium text-center text-white text-lg mb-2">{egg.name}</p>
                          <Dialog>
                          <DialogTrigger asChild>
                            <Button
                            variant="secondary"
                            size="sm"
                            className="mt-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEgg(egg)
                            }}
                            >
                            Learn more
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xl z-10">
                            <DialogHeader>
                            <DialogTitle>{selectedEgg?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-6">
                            <img
                              src={selectedEgg?.image_url || "/placeholder.svg"}
                              alt={selectedEgg?.name}
                              className="w-120 h-120 object-contain rounded-lg mx-auto mb-6"
                            />
                            <p className="text-lg leading-relaxed">{selectedEgg?.description}</p>
                            </div>
                          </DialogContent>
                          </Dialog>
                        </CardContent>
                        </Card>
                      </motion.div>
                      ))}
                    </div>
                    </div>

                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 max-w-4xl">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-semibold">Selected Plan</h3>
                        {plan.isTrial || plan.price === 0 ? (
                          <div className="flex items-center text-green-500">
                            <LucideGift className="w-5 h-5 mr-2" />
                            <span className="font-medium">Free Plan</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-500">
                            <LucideCreditCard className="w-5 h-5 mr-2" />
                            <span className="font-medium">${plan.price}/month</span>
                          </div>
                        )}
                      </div>

                      <h4 className="text-xl font-medium mb-6">{plan.name}</h4>

                      <div className="relative">
                        <div ref={carouselRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                          <div className="flex space-x-6">
                            {planFeatures.map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{
                                  opacity: currentPlanIndex === index ? 1 : 0.5,
                                  scale: currentPlanIndex === index ? 1 : 0.9,
                                }}
                                className="snap-center shrink-0 w-[200px] h-48"
                              >
                                <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                                  <span className="text-4xl mb-3">{item.icon}</span>
                                  <div className="text-2xl font-bold">
                                    {item.value}
                                    {item.unit}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-2">{item.label}</div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                          onClick={() =>
                            setCurrentPlanIndex((prev) => (prev === 0 ? planFeatures.length - 1 : prev - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                          onClick={() =>
                            setCurrentPlanIndex((prev) => (prev === planFeatures.length - 1 ? 0 : prev + 1))
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Button type="submit" disabled={processing || !isValid} className="w-full h-12 text-lg font-medium">
                    {processing ? "Creating..." : "Deploy Server"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </div>
    </div>
  )
}

