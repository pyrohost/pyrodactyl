import { usePage, router } from "@inertiajs/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  Cpu,
  HardDrive,
  Network,
  Server,
  Archive,
  MemoryStickIcon as Memory,
  LucideAlertCircle,
  LucideMemoryStick,
  LucideCheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface Resource {
  id: number
  type: string
  value: number
  price: string
  discounted_price: string | null
  is_discounted: boolean
  is_hidden: boolean
  amount: number
  limit: number
}

interface PageProps {
  resources: Resource[]
  auth: {
    user: {
      coins: number
    }
  }
  flash: {
    error: {
      title: string
      desc: string
    } | null
  }
}

export default function PriceContainer() {
  const { props } = usePage<PageProps>()
  console.log(props)
  const [loading, setLoading] = useState<number | null>(null)
  const { flash } = usePage().props
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (flash.error) {
      setShowError(true)
    }
  }, [flash.error])

  useEffect(() => {
    if (flash.success) {
      setShowSuccess(true)
    }
  }, [flash.error])

  

  const formatPrice = (price: string): number => {
    return Math.round(Number.parseFloat(price))
  }

  const { resource } = props
  console.log(resource)

  const [selectedItem, setSelectedItem] = useState<Resource | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handlePurchase = (resource: Resource) => {
    setSelectedItem(resource)
    setDrawerOpen(true)
  }

  const confirmPurchase = () => {
    if (selectedItem) {
      router.visit(`/api/inerstia/shop/buy/${selectedItem.id}?verify=redirect`, {
        method: "post",
        onFinish: () => {
          setDrawerOpen(false)
          setSelectedItem(null)
        },
      })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "CPU":
        return Cpu
      case "RAM":
        return LucideMemoryStick
      case "DISK":
        return HardDrive
      case "ALLOCATION":
        return Network
      case "SERVER":
        return Server
      case "BACKUP":
        return Archive
      default:
        return Cpu
    }
  }

  return (
    <>
      <AlertDialog open={showError}  onOpenChange={setShowError}>
        <AlertDialogContent className="max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <LucideAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">{flash?.error?.title || 'Error during transaction'}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base">{flash?.error?.desc || 'No description given'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent className="max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <LucideCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold">
              {flash?.success?.title || 'Success'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            {flash?.success?.desc || 'Operation completed successfully'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resource &&
          resource.map((item, index) => {
            if (item.is_hidden) return null
            const Icon = getIcon(item.type)

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.03,
                  transition: { duration: 0.2 },
                }}
              >
                <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl hover:animate-out flex flex-col h-full">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-5 scale-150 mr-4">
                    <Icon className="w-24 h-24" />
                  </div>
                  <CardHeader className="p-4 flex-grow">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl dark:bg-white/10 bg-black/10">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-medium">{item.type}</CardTitle>
                        <p className="text-sm text-muted-foreground">Value: {item.value}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col items-start space-y-4">
                      {item.is_discounted ? (
                        <div className="space-y-1">
                          <p className="text-sm line-through text-muted-foreground">{item.price} coins</p>
                          <p className="text-2xl font-bold text-green-500">{item.discounted_price} coins</p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold">{formatPrice(item.price)} coins</p>
                      )}
                      {item.limit !== -1 && (
                        <span className="text-sm text-muted-foreground">Limited: {item.limit} left</span>
                      )}
                      <Button onClick={() => handlePurchase(item)} className="w-full" variant="default">
                        Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} >
        <DrawerContent className="max-h-[85vh]">
          <div className="p-6 sm:p-8">
        <div className="max-w-md mx-auto">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-2xl font-semibold tracking-tight">
          Confirm Your Purchase
            </DrawerTitle>

            <DrawerDescription className="mt-6">
          {selectedItem && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-xl font-medium">
              {formatPrice(selectedItem.price)} coins
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              will be deducted from your balance
            </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-lg font-medium">{props.auth.user.coins} coins</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">After Purchase</p>
              <p className="text-lg font-medium">
                {props.auth.user.coins - formatPrice(selectedItem.price)} coins
              </p>
            </div>
              </div>
            </div>
          )}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex gap-4 mt-8">
            <Button 
          variant="outline" 
          onClick={() => setDrawerOpen(false)} 
          className="flex-1 rounded-lg"
            >
          Cancel
            </Button>
            <Button 
          onClick={confirmPurchase} 
          className="flex-1 rounded-lg"
            >
          Confirm Purchase
            </Button>
          </div>
        </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

