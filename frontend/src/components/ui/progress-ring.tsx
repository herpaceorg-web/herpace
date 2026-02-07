import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number // 0-100
  size?: number // diameter in pixels
  strokeWidth?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  children?: React.ReactNode
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      size = 48,
      strokeWidth = 4,
      className,
      trackClassName,
      indicatorClassName,
      children,
    },
    ref
  ) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background track */}
          <circle
            className={cn("text-muted", trackClassName)}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress indicator */}
          <circle
            className={cn("text-primary transition-all duration-300 ease-in-out", indicatorClassName)}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    )
  }
)

ProgressRing.displayName = "ProgressRing"

export { ProgressRing }
