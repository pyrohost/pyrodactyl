"use client"

import { useState, useMemo } from "react"
import { usePage } from "@inertiajs/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Settings2, Edit2, Lock } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import getServerStartup from "@/api/swr/getServerStartup"
import updateStartupVariable from "@/api/server/updateStartupVariable"

const formSchema = z.object({
  value: z.string().min(1),
})

export default function StartupVariables() {
  const { server } = usePage().props as { server: { uuid: string } }
  const { data, mutate } = getServerStartup(server.uuid)
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const sortedVariables = useMemo(() => {
    return data?.variables.sort((a, b) => a.name.localeCompare(b.name)) || []
  }, [data?.variables])

  const handleEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedVariable) return

    try {
      setIsLoading(true)
      await updateStartupVariable(server.uuid, selectedVariable, values.value)
      await mutate()
      toast.success("Variable updated successfully")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to update variable")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full mt-5">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Startup Variables
        </CardTitle>
        <CardDescription>Configure your server's startup parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {sortedVariables.map((variable) => (
            <motion.div
              key={variable.envVariable}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex flex-col">
                <p className="font-medium text-lg">{variable.name}</p>
                <p className="text-sm text-muted-foreground mb-2">{variable.description}</p>
                <div className="flex flex-wrap gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {variable.serverValue || variable.defaultValue}
                  </code>
                  <code className="text-xs bg-background px-2 py-1 rounded">ENV: {variable.envVariable}</code>
                </div>
              </div>
              {variable.isEditable ? (
                <Dialog
                  open={open && selectedVariable === variable.envVariable}
                  onOpenChange={(isOpen) => {
                    setOpen(isOpen)
                    if (isOpen) {
                      setSelectedVariable(variable.envVariable)
                      form.reset({ value: variable.serverValue || variable.defaultValue })
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit {variable.name}</DialogTitle>
                      <DialogDescription>{variable.description}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

