import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  variant: 'default' | 'error' | 'success' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  error: (title: string, description?: string) => void
  success: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast = { ...toast, id }
      setToasts((prev) => [...prev, newToast])

      const duration = toast.duration ?? 5000
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ variant: 'error', title, description })
    },
    [addToast]
  )

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ variant: 'success', title, description })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ variant: 'warning', title, description })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ variant: 'info', title, description })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, error, success, warning, info }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
