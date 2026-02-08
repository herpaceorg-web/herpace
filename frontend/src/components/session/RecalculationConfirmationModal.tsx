import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { RecalculationConfirmationResponse, RecalculationPreviewDto } from '@/types/api'
import { CalendarDayChange } from '@/components/calendar/CalendarDayChange'

interface RecalculationConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed: () => void
  onDeclined: () => void
  preview?: RecalculationPreviewDto
}

export function RecalculationConfirmationModal({
  open,
  onOpenChange,
  onConfirmed,
  onDeclined,
  preview,
}: RecalculationConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen) {
      // Closing via X button or overlay click = decline
      await handleDecline()
      return
    }
    onOpenChange(newOpen)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await api.post<Record<string, never>, RecalculationConfirmationResponse>(
        '/api/sessions/confirm-recalculation',
        {}
      )
      onConfirmed()
      onOpenChange(false)
    } catch (err) {
      console.error('Error confirming recalculation:', err)
      setError('Failed to apply changes. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await api.post<Record<string, never>, RecalculationConfirmationResponse>(
        '/api/sessions/decline-recalculation',
        {}
      )
      onDeclined()
      onOpenChange(false)
    } catch (err) {
      console.error('Error declining recalculation:', err)
      setError('Failed to decline. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group session changes by month
  const sessionsByMonth = useMemo(() => {
    if (!preview?.sessionChanges) return {}

    return preview.sessionChanges.reduce((acc, change) => {
      const date = new Date(change.scheduledDate)
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(change)
      return acc
    }, {} as Record<string, typeof preview.sessionChanges>)
  }, [preview?.sessionChanges])

  const monthKeys = Object.keys(sessionsByMonth)

  // Calculate total distance reduction
  const totalDistanceReduction = useMemo(() => {
    if (!preview?.sessionChanges) return 0
    return preview.sessionChanges.reduce((acc, change) => {
      const oldDist = change.oldDistance ?? 0
      const newDist = change.newDistance ?? 0
      return acc + (oldDist - newDist)
    }, 0)
  }, [preview?.sessionChanges])

  const hasPreview = preview && preview.sessionChanges && preview.sessionChanges.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`bg-card max-h-[85vh] overflow-hidden flex flex-col ${hasPreview ? 'sm:max-w-[600px]' : 'sm:max-w-[500px]'}`}>
        <DialogHeader>
          <DialogTitle className="font-petrona text-[32px] font-normal text-foreground">
            Adjust Your Training Plan?
          </DialogTitle>
          <DialogDescription>
            {hasPreview
              ? 'Based on your recent training, we recommend the following adjustments.'
              : "We've noticed your plan might need adjusting based on your recent training."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* AI Summary */}
          {preview?.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {preview.summary}
            </p>
          )}

          {/* Summary Alert */}
          {hasPreview && (
            <Alert className="bg-muted border-border rounded-lg">
              <AlertDescription>
                <strong>{preview.sessionsAffectedCount} sessions</strong> will be adjusted
                {totalDistanceReduction > 0 && (
                  <span> with a total reduction of <strong>{Math.round(totalDistanceReduction)} mi</strong></span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Session Changes by Month */}
          {hasPreview && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {monthKeys.map((monthKey, index) => (
                <div key={monthKey}>
                  {index > 0 && (
                    <div className="border-t border-border my-4" />
                  )}
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    {monthKey.split(' ')[0]} Sessions to be Adjusted:
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {sessionsByMonth[monthKey].map((change) => (
                      <CalendarDayChange
                        key={change.sessionId}
                        change={change}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback for no preview */}
          {!hasPreview && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've detected that your recent workouts have been different from what was planned.
              We can update your upcoming sessions to better match your current fitness level and training patterns.
            </p>
          )}

          {error && (
            <Alert variant="error" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={handleDecline} disabled={isSubmitting}>
            No, Keep Current Plan
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Applying...' : 'Yes, Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
