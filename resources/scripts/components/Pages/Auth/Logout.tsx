import type React from "react"
import { useState } from "react"
import { useForm, Head } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

const Logout: React.FC = () => {
  const { processing, post } = useForm({})
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLogout = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnimating(true)
    setTimeout(() => {
      post("/auth/logout")
    }, 2000) // Delay logout for 2 seconds to show the animation
  }

  return (
    <>
      <Head title="Logout" />
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Logout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4 text-zinc-600 dark:text-zinc-300">Are you sure you want to logout?</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <form onSubmit={handleLogout}>
              <Button
                type="submit"
                variant="destructive"
                disabled={processing || isAnimating}
                className={`w-32 ${processing || isAnimating ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {processing ? "Logging out..." : "Logout"}
              </Button>
            </form>
            
          </CardFooter>
        </Card>
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.h1
                className="text-white text-7xl font-bold"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: [0.5, 1.2, 1],
                  opacity: [0, 1, 0],
                  rotate: [0, 0, 720],
                }}
                transition={{
                  duration: 2,
                  times: [0, 0.5, 1],
                  ease: "easeInOut",
                }}
              >
                See you next time!
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default Logout

