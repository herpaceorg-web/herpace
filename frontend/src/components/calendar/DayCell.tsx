import { CyclePhase, IntensityLevel, WorkoutType } from '@/types/api'
import type { SessionSummary } from '@/types/api'
import { getCyclePhaseColor } from '@/utils/cyclePhases'
import { cn } from '@/lib/utils'

interface DayCellProps {
  date: Date
  session?: SessionSummary
  cyclePhase?: CyclePhase
  isCurrentMonth: boolean
  onClick?: () => void
}

const intensityColors = {
  [IntensityLevel.Low]: 'bg-blue-500',
  [IntensityLevel.Moderate]: 'bg-yellow-500',
  [IntensityLevel.High]: 'bg-red-500',
}

const intensityLabels = {
  [IntensityLevel.Low]: 'L',
  [IntensityLevel.Moderate]: 'M',
  [IntensityLevel.High]: 'H',
}

export function DayCell({ date, session, cyclePhase, isCurrentMonth, onClick }: DayCellProps) {
  const dayNumber = date.getDate()
  const hasSession = !!session
  const isRest = session?.workoutType === WorkoutType.Rest
  const isCompleted = !!session?.completedAt
  const isSkipped = !!session?.isSkipped

  // Build background class based on cycle phase
  const bgClass = cyclePhase !== undefined ? getCyclePhaseColor(cyclePhase) : 'bg-white'

  // Determine if cell should be interactive
  const isClickable = hasSession && onClick

  return (
    <div
      className={cn(
        'min-h-20 sm:min-h-24 border rounded p-1 sm:p-2 transition-colors',
        bgClass,
        !isCurrentMonth && 'opacity-40',
        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary',
        'flex flex-col'
      )}
      onClick={isClickable ? onClick : undefined}
      title={session ? `${session.sessionName}${session.durationMinutes ? ` - ${session.durationMinutes} min` : ''}` : undefined}
    >
      {/* Day number and intensity badge */}
      <div className="flex justify-between items-start mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {dayNumber}
        </span>

        {/* Status indicators - only show one at a time */}
        {/* Completion indicator */}
        {isCompleted && (
          <div className="text-green-600 text-sm sm:text-base" title="Completed">
            ✓
          </div>
        )}
        {/* Skip indicator */}
        {!isCompleted && isSkipped && (
          <div className="text-gray-500 text-sm sm:text-base" title="Skipped">
            –
          </div>
        )}
        {/* Intensity badge (only for non-rest workouts that aren't completed or skipped) */}
        {!isCompleted && !isSkipped && hasSession && !isRest && session.intensityLevel !== undefined && (
          <div
            className={cn(
              'w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center',
              intensityColors[session.intensityLevel]
            )}
            title={`Intensity: ${intensityLabels[session.intensityLevel]}`}
          >
            <span className="text-white text-[8px] sm:text-[10px] font-bold">
              {intensityLabels[session.intensityLevel]}
            </span>
          </div>
        )}
      </div>

      {/* Session info */}
      {hasSession && (
        <div className="flex-1 flex flex-col justify-start space-y-0.5">
          {/* Workout name */}
          <p
            className={cn(
              'text-xs font-semibold leading-tight line-clamp-2',
              isRest && 'text-gray-500',
              !isRest && 'text-gray-900'
            )}
          >
            {session.sessionName}
          </p>

          {/* Duration */}
          {session.durationMinutes && !isRest && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {session.durationMinutes} min
            </p>
          )}
        </div>
      )}
    </div>
  )
}
