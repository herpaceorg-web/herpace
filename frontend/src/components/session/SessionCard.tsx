import type { SessionDetailDto } from '@/types/api'
import { WorkoutType, CyclePhase } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SessionCardProps {
  session: SessionDetailDto
}

const workoutTypeColors: Record<WorkoutType, string> = {
  [WorkoutType.Rest]: 'bg-gray-500 text-white',
  [WorkoutType.Easy]: 'bg-blue-500 text-white',
  [WorkoutType.Tempo]: 'bg-yellow-500 text-white',
  [WorkoutType.Interval]: 'bg-orange-500 text-white',
  [WorkoutType.Long]: 'bg-green-500 text-white',
}

const workoutTypeLabels: Record<WorkoutType, string> = {
  [WorkoutType.Rest]: 'Rest',
  [WorkoutType.Easy]: 'Easy',
  [WorkoutType.Tempo]: 'Tempo',
  [WorkoutType.Interval]: 'Interval',
  [WorkoutType.Long]: 'Long Run',
}

const cyclePhaseLabels: Record<CyclePhase, string> = {
  [CyclePhase.Menstrual]: 'Menstrual',
  [CyclePhase.Follicular]: 'Follicular',
  [CyclePhase.Ovulatory]: 'Ovulatory',
  [CyclePhase.Luteal]: 'Luteal',
}

const cyclePhaseColors: Record<CyclePhase, string> = {
  [CyclePhase.Menstrual]: 'bg-red-100 text-red-800 border-red-300',
  [CyclePhase.Follicular]: 'bg-green-100 text-green-800 border-green-300',
  [CyclePhase.Ovulatory]: 'bg-orange-100 text-orange-800 border-orange-300',
  [CyclePhase.Luteal]: 'bg-blue-100 text-blue-800 border-blue-300',
}

export function SessionCard({ session }: SessionCardProps) {
  const formattedDate = new Date(session.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{session.sessionName}</CardTitle>
            <CardDescription>{formattedDate}</CardDescription>
          </div>

          <div className="flex gap-2">
            {/* Workout type badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${workoutTypeColors[session.workoutType]}`}>
              {workoutTypeLabels[session.workoutType]}
            </span>

            {/* Cycle phase badge */}
            {session.cyclePhase !== undefined && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cyclePhaseColors[session.cyclePhase]}`}>
                {cyclePhaseLabels[session.cyclePhase]}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Session details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {session.distance && (
              <div>
                <span className="text-muted-foreground">Distance:</span>{' '}
                <span className="font-medium">{session.distance} km</span>
              </div>
            )}

            {session.durationMinutes && (
              <div>
                <span className="text-muted-foreground">Duration:</span>{' '}
                <span className="font-medium">{session.durationMinutes} min</span>
              </div>
            )}
          </div>

          {/* Description */}
          {session.sessionDescription && (
            <p className="text-sm text-muted-foreground">
              {session.sessionDescription}
            </p>
          )}

          {/* Completion status */}
          {session.isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm font-medium text-green-800">✓ Completed</p>
              {session.actualDistance && (
                <p className="text-xs text-green-700 mt-1">
                  Actual: {session.actualDistance} km in {session.actualDurationMinutes} min
                </p>
              )}
            </div>
          )}

          {session.isSkipped && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm font-medium text-gray-800">Skipped</p>
            </div>
          )}

          {/* Action buttons (disabled for basic setup) */}
          {!session.isCompleted && !session.isSkipped && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" disabled>
                Complete
              </Button>
              <Button size="sm" variant="outline" disabled>
                Skip
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
