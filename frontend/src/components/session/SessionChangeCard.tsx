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
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{change.sessionName}</p>
        <span className="text-xs text-gray-500 dark:text-gray-400">{dateStr}</span>
      </div>

      <div className="space-y-2">
        {/* Distance change */}
        {distanceChanged && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Distance:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 line-through">
                {change.oldDistance ? `${change.oldDistance} km` : 'N/A'}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {change.newDistance ? `${change.newDistance} km` : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Duration change */}
        {durationChanged && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 line-through">
                {change.oldDuration ? `${change.oldDuration} min` : 'N/A'}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {change.newDuration ? `${change.newDuration} min` : 'N/A'}
              </span>
            </div>
          </div>
        )}

        {/* Workout type change */}
        {typeChanged && change.oldWorkoutType !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 line-through">
                {workoutTypeLabels[change.oldWorkoutType]}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {workoutTypeLabels[change.newWorkoutType]}
              </span>
            </div>
          </div>
        )}

        {/* Intensity change */}
        {intensityChanged && change.oldIntensityLevel !== undefined && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Intensity:</span>
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 line-through">
                {intensityLabels[change.oldIntensityLevel]}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {intensityLabels[change.newIntensityLevel]}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
