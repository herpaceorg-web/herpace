import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkoutType, type SessionDetailDto, type CompleteSessionRequest } from '@/types/api'

interface CompleteSessionDialogProps {
  session: SessionDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (data: CompleteSessionRequest) => Promise<void>
}

export function CompleteSessionDialog({ session, open, onOpenChange, onComplete }: CompleteSessionDialogProps) {
  const [actualDistance, setActualDistance] = useState(session.distance?.toString() || '')
  const [actualDuration, setActualDuration] = useState(session.durationMinutes?.toString() || '')
  const [rpe, setRpe] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false)

  const isRestDay = session.workoutType === WorkoutType.Rest

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      if (isRestDay && !isLoggingWorkout) {
        await onComplete({})
        onOpenChange(false)
        return
      }

      const data: CompleteSessionRequest = {
        actualDistance: actualDistance ? parseFloat(actualDistance) : undefined,
        actualDuration: actualDuration ? parseInt(actualDuration) : undefined,
        rpe: rpe ? parseInt(rpe) : undefined,
        userNotes: userNotes || undefined
      }

      console.log('Completing session with data:', data)
      await onComplete(data)

      // Reset form
      setActualDistance(session.distance?.toString() || '')
      setActualDuration(session.durationMinutes?.toString() || '')
      setRpe('')
      setUserNotes('')
      setIsLoggingWorkout(false)

      onOpenChange(false)
    } catch (error) {
      console.error('Error completing session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isRestDay ? 'Complete Rest Day' : 'Complete Workout'}</DialogTitle>
          <DialogDescription>
            {isRestDay
              ? 'No workout details needed for rest days. You can confirm or log a workout instead.'
              : 'Review and update your workout details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {(!isRestDay || isLoggingWorkout) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="actualDistance">Distance (km)</Label>
                  <Input
                    id="actualDistance"
                    type="number"
                    step="0.01"
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    placeholder="Enter distance"
                  />
                  {session.distance && (
                    <p className="text-xs text-muted-foreground">
                      Planned: {session.distance} km
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualDuration">Duration (minutes)</Label>
                  <Input
                    id="actualDuration"
                    type="number"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(e.target.value)}
                    placeholder="Enter duration"
                  />
                  {session.durationMinutes && (
                    <p className="text-xs text-muted-foreground">
                      Planned: {session.durationMinutes} min
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rpe">How did the workout feel? (RPE 1-10)</Label>
                  <Input
                    id="rpe"
                    type="number"
                    min="1"
                    max="10"
                    value={rpe}
                    onChange={(e) => setRpe(e.target.value)}
                    placeholder="1 (very easy) - 10 (maximum effort)"
                    required={!isRestDay || isLoggingWorkout}
                  />
                  <p className="text-xs text-muted-foreground">
                    Rate your perceived exertion: 1 = very easy, 10 = maximum effort
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userNotes">Notes (optional)</Label>
                  <textarea
                    id="userNotes"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="How did you feel? Any issues or observations?"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {isRestDay && !isLoggingWorkout && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLoggingWorkout(true)}
                disabled={isSubmitting}
              >
                Log a Workout
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Completing...'
                : isRestDay && !isLoggingWorkout
                  ? 'Confirm Rest Day'
                  : 'Save Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
