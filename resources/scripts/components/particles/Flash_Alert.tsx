import { useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { LucideAlertCircle, LucideCheckCircle } from "lucide-react"

export const FlashAlert = () => {
  const { flash } = usePage().props
  const [showError, setShowError] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (flash.error) setShowError(true)
    if (flash.success) setShowSuccess(true)
  }, [flash])

  return (
    <>
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent className="max-w-[425px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <LucideAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">
                {flash?.error?.title || 'Error during transaction'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4 text-base">
              {flash?.error?.desc || 'No description given'}
            </AlertDialogDescription>
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
    </>
  )
}