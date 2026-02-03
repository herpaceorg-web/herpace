import { useToast } from '@/contexts/ToastContext'
import { Alert, AlertTitle, AlertDescription } from './alert'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-top-full duration-300"
        >
          <Alert variant={toast.variant} onClose={() => removeToast(toast.id)}>
            <AlertTitle>{toast.title}</AlertTitle>
            {toast.description && (
              <AlertDescription>{toast.description}</AlertDescription>
            )}
          </Alert>
        </div>
      ))}
    </div>
  )
}
