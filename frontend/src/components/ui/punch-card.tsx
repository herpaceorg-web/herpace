import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface PunchCardDay {
  dayNumber: number
  hasSession: boolean
  isCompleted: boolean
  isSkipped: boolean
  isRest: boolean
}

interface PunchCardProps {
  days: PunchCardDay[]
  className?: string
}

const PunchCard = React.forwardRef<HTMLDivElement, PunchCardProps>(
  ({ days, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-muted flex items-center justify-center gap-6 p-2 rounded-full",
          className
        )}
      >
        {days.map((day, index) => {
          const isCompleted = day.isCompleted
          const isPending = day.hasSession && !day.isCompleted && !day.isSkipped
          const isSkipped = day.isSkipped
          const isRest = day.isRest || !day.hasSession

          return (
            <div
              key={index}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isPending && "bg-background text-foreground border border-border",
                isSkipped && "bg-destructive/10 text-destructive",
                isRest && "text-muted-foreground/50"
              )}
              title={
                isCompleted ? `Day ${day.dayNumber} - Completed` :
                isSkipped ? `Day ${day.dayNumber} - Skipped` :
                isPending ? `Day ${day.dayNumber} - Pending` :
                `Day ${day.dayNumber} - Rest`
              }
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : isRest ? (
                <span className="text-[10px]">–</span>
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
