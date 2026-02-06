import { useState } from 'react'
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
import { TrendingUp, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { RecalculationConfirmationResponse } from '@/types/api'

interface RecalculationConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed: () => void
  onDeclined: () => void
}

export function RecalculationConfirmationModal({
  open,
  onOpenChange,
  onConfirmed,
  onDeclined,
}: RecalculationConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('Failed to start plan adaptation. Please try again.')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Adjust Your Training Plan?
          </DialogTitle>
          <DialogDescription>
            We've noticed your plan might need adjusting based on your recent training.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            We've detected that your recent workouts have been different from what was planned.
            We can update your upcoming sessions to better match your current fitness level and training patterns.
          </p>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDecline} disabled={isSubmitting}>
            No, Keep Current Plan
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Yes, Adapt My Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
