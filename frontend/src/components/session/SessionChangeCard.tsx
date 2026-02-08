import type { SessionChangeDto } from '@/types/api'
import { WorkoutType, IntensityLevel } from '@/types/api'

interface SessionChangeCardProps {
  change: SessionChangeDto
}

const workoutTypeLabels: Record<WorkoutType, string> = {
  [WorkoutType.Easy]: 'Easy Run',
  [WorkoutType.Long]: 'Long Run',
  [WorkoutType.Tempo]: 'Tempo Run',
  [WorkoutType.Interval]: 'Interval Training',
  [WorkoutType.Rest]: 'Rest Day'
}

const intensityLabels: Record<IntensityLevel, string> = {
  [IntensityLevel.Low]: 'Low',
  [IntensityLevel.Moderate]: 'Moderate',
  [IntensityLevel.High]: 'High'
}

export function SessionChangeCard({ change }: SessionChangeCardProps) {
  const date = new Date(change.scheduledDate)
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  // Check which fields actually changed
  const distanceChanged = change.oldDistance !== change.newDistance
  const durationChanged = change.oldDuration !== change.newDuration
  const typeChanged = change.oldWorkoutType !== change.newWorkoutType
  const intensityChanged = change.oldIntensityLevel !== change.newIntensityLevel

  // If nothing changed, don't render
  if (!distanceChanged && !durationChanged && !typeChanged && !intensityChanged) {
    return null
  }

  return (
    <div className="bg-muted rounded-lg p-3 border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm text-foreground">{change.sessionName}</p>
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </div>

      <div className="space-y-2">
        {/* Distance change */}
        {distanceChanged && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Distance:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#b54a32] line-through">
                {change.oldDistance ? `${change.oldDistance} km` : 'N/A'}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary font-medium">
                {change.newDistance ? `${change.newDistance} km` : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Duration change */}
        {durationChanged && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Duration:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#b54a32] line-through">
                {change.oldDuration ? `${change.oldDuration} min` : 'N/A'}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary font-medium">
                {change.newDuration ? `${change.newDuration} min` : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Workout type change */}
        {typeChanged && change.oldWorkoutType !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Type:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#b54a32] line-through">
                {workoutTypeLabels[change.oldWorkoutType] ?? 'Unknown'}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary font-medium">
                {workoutTypeLabels[change.newWorkoutType] ?? 'Unknown'}
              </span>
            </div>
          </div>
        )}

        {/* Intensity change */}
        {intensityChanged && change.oldIntensityLevel !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Intensity:</span>
            <div className="flex items-center gap-2">
              <span className="text-[#b54a32] line-through">
                {intensityLabels[change.oldIntensityLevel] ?? 'Unknown'}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-primary font-medium">
                {intensityLabels[change.newIntensityLevel] ?? 'Unknown'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
