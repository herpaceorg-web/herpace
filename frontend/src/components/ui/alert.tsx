import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { FileWarning, AlertCircle, CheckCircle, Info, X } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 flex items-start gap-3",
  {
    variants: {
      variant: {
        default: "bg-[#FCF9F3] border-[#EBE8E2] text-[#141414]",
        error: "bg-[#FCF9F3] border-[#EBE8E2] text-[#141414]",
        success: "bg-[#FCF9F3] border-[#EBE8E2] text-[#141414]",
        warning: "bg-[#FCF9F3] border-[#EBE8E2] text-[#141414]",
        info: "bg-[#FCF9F3] border-[#EBE8E2] text-[#141414]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconVariants = cva(
  "flex items-center justify-center rounded-xl w-12 h-12 flex-shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gray-600",
        error: "bg-[#A14139]",
        success: "bg-[#677344]",
        warning: "bg-amber-600",
        info: "bg-[#4E6D80]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  default: AlertCircle,
  error: FileWarning,
  success: CheckCircle,
  warning: AlertCircle,
  info: Info,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, onClose, children, ...props }, ref) => {
    const Icon = iconMap[variant || "default"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className={cn(iconVariants({ variant }))}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 pt-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-petrona font-medium leading-none tracking-tight text-base", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-manrope text-sm text-[#141414] mt-1 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
