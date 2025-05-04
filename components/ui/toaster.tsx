"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast key={id} variant={variant} {...props}>
          <div className="flex gap-3">
            {variant === "success" && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
            {variant === "destructive" && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            {variant === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
            {variant === "info" && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
