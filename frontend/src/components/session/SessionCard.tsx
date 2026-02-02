import { useState, useMemo } from 'react'
import type { SessionDetailDto, CompleteSessionRequest, SessionCompletionResponse, CyclePhaseTipsDto } from '@/types/api'
import { WorkoutType, CyclePhase } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CompleteSessionDialog } from './CompleteSessionDialog'
import { api } from '@/lib/api-client'

interface SessionCardProps {
  session: SessionDetailDto
  cyclePhaseTips?: CyclePhaseTipsDto
  onSessionUpdated?: () => void
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

export function SessionCard({ session, cyclePhaseTips, onSessionUpdated }: SessionCardProps) {
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [localSession, setLocalSession] = useState(session)

  const formattedDate = new Date(localSession.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  // Get a random wellness tip
  const randomTip = useMemo(() => {
    if (!cyclePhaseTips) return null

    const allTips = [
      ...cyclePhaseTips.nutritionTips.map(tip => ({ category: 'Nutrition', tip })),
      ...cyclePhaseTips.restTips.map(tip => ({ category: 'Rest', tip })),
      ...cyclePhaseTips.injuryPreventionTips.map(tip => ({ category: 'Injury Prevention', tip })),
      ...cyclePhaseTips.moodInsights.map(tip => ({ category: 'Mood', tip })),
    ]

    if (allTips.length === 0) return null

    const randomIndex = Math.floor(Math.random() * allTips.length)
    return allTips[randomIndex]
  }, [cyclePhaseTips])

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const response = await api.put<{ skipReason?: string }, SessionCompletionResponse>(
        `/api/sessions/${localSession.id}/skip`,
        {}
      )

      console.log('Session skipped successfully:', response)
      console.log('User did NOT complete this workout:', {
        sessionId: localSession.id,
        sessionName: localSession.sessionName,
        scheduledDate: localSession.scheduledDate,
        skipped: true
      })

      // Update local state to reflect the skip
      setLocalSession({ ...localSession, isSkipped: true })

      // Notify parent to refresh data
      onSessionUpdated?.()
    } catch (error) {
      console.error('Error skipping session:', error)
      alert('Failed to skip session. Please try again.')
    } finally {
      setIsSkipping(false)
    }
  }

  const handleComplete = async (data: CompleteSessionRequest) => {
    const response = await api.put<CompleteSessionRequest, SessionCompletionResponse>(
      `/api/sessions/${localSession.id}/complete`,
      data
    )

    console.log('Session completed successfully:', response)
    console.log('User COMPLETED this workout:', {
      sessionId: localSession.id,
      sessionName: localSession.sessionName,
      scheduledDate: localSession.scheduledDate,
      actualDistance: data.actualDistance,
      actualDuration: data.actualDuration,
      rpe: data.rpe,
      userNotes: data.userNotes,
      completed: true
    })

    // Update local state to reflect the completion
    setLocalSession({
      ...localSession,
      isCompleted: true,
      actualDistance: data.actualDistance,
      actualDuration: data.actualDuration,
      rpe: data.rpe,
      userNotes: data.userNotes
    })

    // Notify parent to refresh data
    onSessionUpdated?.()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{localSession.sessionName}</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>

            <div className="flex gap-2">
              {/* Workout type badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${workoutTypeColors[localSession.workoutType]}`}>
                {workoutTypeLabels[localSession.workoutType]}
              </span>

              {/* Cycle phase badge */}
              {localSession.cyclePhase !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cyclePhaseColors[localSession.cyclePhase]}`}>
                  {cyclePhaseLabels[localSession.cyclePhase]}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Session details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {localSession.distance && (
                <div>
                  <span className="text-muted-foreground">Distance:</span>{' '}
                  <span className="font-medium">{localSession.distance} km</span>
                </div>
              )}

              {localSession.durationMinutes && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-medium">{localSession.durationMinutes} min</span>
                </div>
              )}
            </div>

            {/* Description */}
            {localSession.sessionDescription && (
              <p className="text-sm text-muted-foreground">
                {localSession.sessionDescription}
              </p>
            )}

            {/* Wellness Tip */}
            {randomTip && cyclePhaseTips && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-md p-3">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                  {cyclePhaseTips.phase} Phase Tip • {randomTip.category}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {randomTip.tip}
                </p>
              </div>
            )}

            {/* Completion status */}
            {localSession.isCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-800">✓ Completed</p>
                {localSession.actualDistance && (
                  <p className="text-xs text-green-700 mt-1">
                    Actual: {localSession.actualDistance} km in {localSession.actualDuration} min
                  </p>
                )}
                {localSession.rpe && (
                  <p className="text-xs text-green-700">
                    RPE: {localSession.rpe}/10
                  </p>
                )}
              </div>
            )}

            {localSession.isSkipped && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm font-medium text-gray-800">Skipped</p>
              </div>
            )}

            {/* Action buttons */}
            {!localSession.isCompleted && !localSession.isSkipped && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => setIsCompleteDialogOpen(true)}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSkipping}
                >
                  {isSkipping ? 'Skipping...' : 'Skip'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CompleteSessionDialog
        session={localSession}
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        onComplete={handleComplete}
      />
    </>
  )
}
