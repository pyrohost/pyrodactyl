"use client"

import { useState, useEffect, useRef } from "react"
import { usePage } from "@inertiajs/react"
import { useForm } from "@inertiajs/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LucideServer, LucideMemoryStick, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Particles } from "@/components/ui/particles"

import { Cpu, Database, HardDrive, Network, Shield, Share2 } from "lucide-react"
import confetti from "canvas-confetti"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"


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

interface Plan {
  name: string
  cpu: number
  memory: number
  disk: number
  databases: number
  backups: number
  allocations: number
}

export default function Create() {
  const { plan, limits, locations, eggs, otherPlans } = usePage<Props>().props

  console.log(plan)
  const [selectedEgg, setSelectedEgg] = useState<Props["eggs"][0] | null>(null)
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isDialogOpen2, setIsDialogOpen2] = useState(false)
  const [selectedEggDetails, setSelectedEggDetails] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loadingLocations, setLoadingLocations] = useState(false)
  const cleanDescription = (description: string | null | undefined) => {
    if (!description) return ""
    return description.replace(/server_ready/gi, "").trim()
  }

  const plansArray = Array.isArray(plan) ? plan : [plan]

  const PlanSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 ">Select a Plan</h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-100">Choose a plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plansArray.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-zinc-800/50",
              selectedPlan === plan.name && "ring-2 ring-primary border-primary",
            )}
            onClick={() => setSelectedPlan(plan.name)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
                    {selectedPlan === plan.name && (
                      <Badge variant="default" className="bg-primary/20 text-primary border border-primary/20">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Resources */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-100">CPU</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.cpu}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LucideMemoryStick className="w-4 h-4 text-zinc-700 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-100">Memory</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.memory} MB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-zinc-700 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-100">Storage</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.disk} MB</span>
                  </div>

                  <Separator className="my-2 bg-zinc-800/50" />

                  {/* Additional Features */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.databases}</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-100">Databases</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.backups}</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-100">Backups</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.allocations}</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-100">Ports</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {otherPlans?.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-zinc-800/50",
              selectedPlan === plan.name && "ring-2 ring-primary border-primary",
            )}
            onClick={() => setSelectedPlan(plan.name)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-zinc-800 dark:text-zinc-100">{plan.name}</h3>
                    {selectedPlan === plan.name && (
                      <Badge variant="default" className="bg-primary/20 text-primary border border-primary/20">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Resources */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-100">CPU</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.cpu}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LucideMemoryStick className="w-4 h-4 text-zinc-700 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-700 dark:text-zinc-100">Memory</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.memory} MB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-zinc-800 dark:text-zinc-100" />
                      <span className="text-sm text-zinc-800 dark:text-zinc-100">Storage</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.disk} MB</span>
                  </div>

                  <Separator className="my-2 bg-zinc-800/50" />

                  {/* Additional Features */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.databases}</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-100">Databases</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.backups}</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-100">Backups</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{plan.allocations}</span>
                      <p className="text-xs text-zinc-800 dark:text-zinc-100">Ports</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const planFeatures = [
    {
      value: plan.cpu,
      label: "CPU Limit",
      unit: "%",
      icon: Cpu,
      description: "Processing power allocated",
    },
    {
      value: plan.memory,
      label: "Memory",
      unit: "MB",
      icon: HardDrive,
      description: "Available RAM",
    },
    {
      value: plan.disk,
      label: "Storage",
      unit: "MB",
      icon: Database,
      description: "SSD storage space",
    },
    {
      value: plan.databases,
      label: "Databases",
      unit: "",
      icon: Share2,
      description: "MySQL databases",
    },
    {
      value: plan.backups,
      label: "Backups",
      unit: "",
      icon: Shield,
      description: "Automated backups",
    },
    {
      value: plan.allocations,
      label: "Network",
      unit: "",
      icon: Network,
      description: "Port allocations",
    },
  ]

  const handleConfetti = (event?: React.MouseEvent) => {
    // Default to center of screen if no event
    const x = event ? event.clientX / window.innerWidth : 0.5
    const y = event ? event.clientY / window.innerHeight : 0.5

    confetti({
      particleCount: 35,
      spread: 45,
      startVelocity: 15,
      scalar: 0.7,
      ticks: 50,
      gravity: 0.8,
      decay: 0.94,
      origin: { x, y },
      colors: ["#a864fd80", "#29cdff80", "#78ff4480"],
      shapes: ["circle"],
    })
  }

  const handleEggLearnMore = (e: React.MouseEvent, egg: any) => {
    e.preventDefault() // Prevent form submission
    e.stopPropagation() // Stop event bubbling
    setSelectedEggDetails(egg)
    setIsDialogOpen2(true)
  }

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

  useEffect(() => {
    if (selectedPlan) {
      setData("plan_name", selectedPlan)
    }
  }, [selectedPlan])

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    egg_id: "",
    nest_id: "",
    location_id: locations[0]?.id || "",
    plan_name: selectedPlan || "",
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    post("/api/inerstia/servers/create")
  }

  const isValid = data.name && data.egg_id && data.location_id

  return (
    <>
      <div className="min-h-scree bg-transparent">
        <div className="container mx-auto p-6">
          <form onSubmit={(e) => handleSubmit(e)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid gap-8"
            >
              <Card className="overflow-hidden  backdrop-blur-xl">
                <CardContent className="p-8">
                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-xl font-medium">Server Name</label>
                      <Input
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        error={errors.name}
                        placeholder="Give your server a sassy name, Nak Nak works well "
                        className="px-4 py-1 text-2xl h-20 "
                      />
                      {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-2xl font-medium tracking-tight">Select Location</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {locations.map((location) => (
                            <motion.div
                              key={location.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Card
                                      className={cn(
                                        "group cursor-pointer relative overflow-hidden aspect-[16/9] transition-all duration-300 bg-opacity-50",
                                        data.location_id === location.id
                                          ? "ring-2 ring-primary"
                                          : "hover:ring-1 hover:ring-primary/50",
                                      )}
                                      style={{
                                        backgroundImage: `url(${location.image || "/placeholder.svg"})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                      }}
                                      onClick={(e) => {
                                        setLoadingLocations(true)
                                        setData("location_id", location.id)
                                        handleConfetti(e)
                                        setTimeout(() => setLoadingLocations(false), 5) // Simulating a short loading time
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black to-transparent transition-opacity group-hover:opacity-80 " />
                                      <CardContent className="h-full flex flex-col justify-end p-4 relative">
                                        <div className="transform transition-transform group-hover:-translate-y-1">
                                          <p className="text-white font-medium text-lg">{location.short}</p>
                                          <p className="text-white/80 text-sm">{location.long}</p>
                                        </div>
                                      </CardContent>
                                      {loadingLocations && data.location_id === location.id && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                      )}
                                    </Card>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{location.short}</p>
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
                          <motion.div
                            key={egg.id}
                            whileHover={{ scale: 1.02, y: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="w-full"
                          >
                            <Card
                              className={cn(
                                "cursor-pointer relative overflow-hidden min-h-[240px] border border-zinc-800/50",
                                "backdrop-blur-md bg-zinc-900/30 hover:bg-zinc-900/50",
                                "transition-all duration-300 ease-out",
                                data.egg_id === egg.id ? "ring-2 ring-primary/80 shadow-lg shadow-primary/20" : "",
                              )}
                              onClick={(e) => {
                                setData("egg_id", egg.id)
                                setData("nest_id", egg.nest_id)
                                handleConfetti(e)
                              }}
                            >
                              {egg.image_url && (
                                <div
                                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                                  style={{ backgroundImage: `url(${egg.image_url || "/placeholder.svg"})` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-zinc-900/60" />
                                </div>
                              )}
                              <CardContent className="relative z-10 p-8 flex flex-col items-center h-full">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-800/50 dark:to-zinc-900/50 backdrop-blur-md border border-zinc-300 dark:border-zinc-800/50">
                                  <LucideServer className="w-8 h-8 text-primary/80" />
                                </div>
                                <div className="space-y-1 text-center">
                                  <h3 className="font-medium text-zinc-800 dark:text-zinc-100 text-lg tracking-tight">
                                    {egg.name}
                                  </h3>
                                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Click to select this template
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  className="mt-4 text-zinc-800 dark:text-zinc-100 hover:text-primary transition-colors bg-zinc-200/50 dark:bg-zinc-900/50 hover:bg-zinc-300/80 dark:hover:bg-zinc-900/80 border border-zinc-300/50 dark:border-zinc-800/50 hover:bg-primary/30"
                                  onClick={(e) => handleEggLearnMore(e, egg)}
                                >
                                  Learn more
                                </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <PlanSection />

                    <Button
                      type="submit"
                      disabled={processing || !isValid}
                      className="w-full h-12 text-lg font-medium relative overflow-hidden group"
                    >
                      {processing ? "Creating..." : "Deploy Server"}
                      <span className="absolute inset-x-0 h-1 bottom-0 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/*<Particles className="absolute inset-0 z-0 opacity-25" quantity={100} ease={80} color={"#ffffff"} refresh />*/}
          </form>
        </div>
      </div>
      <Dialog open={isDialogOpen2} onOpenChange={setIsDialogOpen2}>
        <DialogContent className="  ">
          <DialogHeader>
            <DialogTitle>{selectedEggDetails?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <img
              src={selectedEggDetails?.image_url || "/placeholder.svg"}
              alt={selectedEggDetails?.name}
              className="w-120 h-120 object-contain rounded-lg mx-auto mb-6"
            />
            <p className="text-lg leading-relaxed">
              {selectedEggDetails?.description
                ? cleanDescription(selectedEggDetails.description)
                : "This server is supported!"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

