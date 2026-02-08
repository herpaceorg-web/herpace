import * as React from "react"
import { cn } from "@/lib/utils"

export interface CountdownDisplayProps {
  days: number
  hours: number
  minutes: number
  seconds?: number
  variant?: 'hero' | 'hero-boxed' | 'inline'
  showSeconds?: boolean
  className?: string
}

const CountdownDisplay = React.forwardRef<HTMLDivElement, CountdownDisplayProps>(
  ({ days, hours, minutes, seconds = 0, variant = 'hero', showSeconds = false, className }, ref) => {

    // Hero variant - large numbers with labels below
    if (variant === 'hero') {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center gap-2", className)}
        >
          <div className="flex flex-col items-center">
            <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none">{days}</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">DAYS</span>
          </div>
          <span className="text-3xl font-light text-muted-foreground mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none">{String(hours).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">HRS</span>
          </div>
          <span className="text-3xl font-light text-muted-foreground mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none">{String(minutes).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">MIN</span>
          </div>
          {showSeconds && (
            <>
              <span className="text-3xl font-light text-muted-foreground mb-4">:</span>
              <div className="flex flex-col items-center">
                <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none">{String(seconds).padStart(2, '0')}</span>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">SEC</span>
              </div>
            </>
          )}
        </div>
      )
    }

    // Hero boxed variant - each segment in its own box (flip clock style)
    if (variant === 'hero-boxed') {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center gap-3", className)}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="bg-foreground text-background rounded-lg px-4 py-3 min-w-[72px]">
              <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none block text-center">{days}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">DAYS</span>
          </div>
          <span className="text-2xl font-light text-muted-foreground mb-6">:</span>
          <div className="flex flex-col items-center gap-1">
            <div className="bg-foreground text-background rounded-lg px-4 py-3 min-w-[72px]">
              <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none block text-center">{String(hours).padStart(2, '0')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">HRS</span>
          </div>
          <span className="text-2xl font-light text-muted-foreground mb-6">:</span>
          <div className="flex flex-col items-center gap-1">
            <div className="bg-foreground text-background rounded-lg px-4 py-3 min-w-[72px]">
              <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none block text-center">{String(minutes).padStart(2, '0')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium tracking-wider">MIN</span>
          </div>
          {showSeconds && (
            <>
              <span className="text-2xl font-light text-muted-foreground mb-6">:</span>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-foreground text-background rounded-lg px-4 py-3 min-w-[72px]">
                  <span className="text-[32px] font-semibold tabular-nums tracking-tight leading-none block text-center">{String(seconds).padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">SEC</span>
              </div>
            </>
          )}
        </div>
      )
    }

    // Inline variant - compact for smaller spaces
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1 font-medium tabular-nums", className)}
      >
        <span>{days}</span>
        <span className="text-muted-foreground text-xs">D</span>
        <span className="text-muted-foreground mx-0.5">:</span>
        <span>{String(hours).padStart(2, '0')}</span>
        <span className="text-muted-foreground text-xs">H</span>
        <span className="text-muted-foreground mx-0.5">:</span>
        <span>{String(minutes).padStart(2, '0')}</span>
        <span className="text-muted-foreground text-xs">M</span>
        {showSeconds && (
          <>
            <span className="text-muted-foreground mx-0.5">:</span>
            <span>{String(seconds).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-xs">S</span>
          </>
        )}
      </div>
    )
  }
)

CountdownDisplay.displayName = "CountdownDisplay"

export { CountdownDisplay }
