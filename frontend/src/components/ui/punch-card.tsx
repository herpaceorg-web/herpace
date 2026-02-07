import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Ban } from "lucide-react"

export interface PunchCardDay {
  dayNumber: number
  hasSession: boolean
  isCompleted: boolean
  isSkipped: boolean
  isRest: boolean
}

export type PunchCardVariant = 'default' | 'compact'

interface PunchCardProps {
  days: PunchCardDay[]
  className?: string
  variant?: PunchCardVariant
}

const PunchCard = React.forwardRef<HTMLDivElement, PunchCardProps>(
  ({ days, className, variant = 'default' }, ref) => {
    const activeDays = days.filter(day => day.hasSession && !day.isRest)

    const completedCount = activeDays.filter(d => d.isCompleted).length
    const skippedCount = activeDays.filter(d => d.isSkipped).length
    const pendingCount = activeDays.length - completedCount - skippedCount
    const totalCount = activeDays.length

    // Compact variant - summary for month/plan views
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-muted flex items-center gap-3 px-3 py-2 rounded-lg",
            className
          )}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: '#677344' }}
            >
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className="text-sm font-medium">{completedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
              <Ban className="w-2.5 h-2.5 text-foreground" />
            </div>
            <span className="text-sm font-medium">{skippedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-background border border-border" />
            <span className="text-sm font-medium">{pendingCount}</span>
          </div>
          <div className="h-4 border-l border-border mx-1" />
          <span className="text-sm font-normal text-muted-foreground">{completedCount}/{totalCount} sessions completed</span>
        </div>
      )
    }

    // Default variant - week view with individual circles
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted flex items-center justify-center gap-6 p-2 rounded-full",
          className
        )}
      >
        {activeDays.map((day, index) => {
          const isCompleted = day.isCompleted
          const isPending = !day.isCompleted && !day.isSkipped
          const isSkipped = day.isSkipped

          return (
            <div
              key={index}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0",
                isCompleted && "text-white",
                (isPending || isSkipped) && "bg-background text-foreground border border-border"
              )}
              style={isCompleted ? { backgroundColor: '#677344' } : undefined}
              title={
                isCompleted ? `Day ${day.dayNumber} - Completed` :
                isSkipped ? `Day ${day.dayNumber} - Skipped` :
                `Day ${day.dayNumber} - Pending`
              }
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : isSkipped ? (
                <Ban className="w-3 h-3" />
              ) : (
                <span>{day.dayNumber}</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }
)

PunchCard.displayName = "PunchCard"

export { PunchCard }
