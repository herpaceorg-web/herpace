import type { Meta, StoryObj } from '@storybook/react'
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
import { TrendingUp, AlertCircle, Calendar, ArrowRight } from 'lucide-react'
import { CalendarDayChange } from '@/components/calendar/CalendarDayChange'
import type { SessionChangeDto } from '@/types/api'
import { WorkoutType, IntensityLevel, CyclePhase } from '@/types/api'

// Mock data for session changes with cycle phases
interface SessionChangeWithPhase extends SessionChangeDto {
  cyclePhase?: CyclePhase;
}

const mockSessionChanges: SessionChangeWithPhase[] = [
  {
    sessionId: '1',
    scheduledDate: '2026-02-10',
    sessionName: 'Easy Recovery Run',
    oldDistance: 5,
    newDistance: 4,
    oldDuration: 45,
    newDuration: 35,
    oldWorkoutType: WorkoutType.Easy,
    newWorkoutType: WorkoutType.Easy,
    oldIntensityLevel: IntensityLevel.Low,
    newIntensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Follicular,
  },
  {
    sessionId: '2',
    scheduledDate: '2026-02-12',
    sessionName: 'Tempo Run',
    oldDistance: 8,
    newDistance: 6,
    oldDuration: 50,
    newDuration: 40,
    oldWorkoutType: WorkoutType.Tempo,
    newWorkoutType: WorkoutType.Easy,
    oldIntensityLevel: IntensityLevel.High,
    newIntensityLevel: IntensityLevel.Moderate,
    cyclePhase: CyclePhase.Ovulatory,
  },
  {
    sessionId: '3',
    scheduledDate: '2026-02-14',
    sessionName: 'Long Run',
    oldDistance: 15,
    newDistance: 12,
    oldDuration: 100,
    newDuration: 80,
    oldWorkoutType: WorkoutType.Long,
    newWorkoutType: WorkoutType.Long,
    oldIntensityLevel: IntensityLevel.Moderate,
    newIntensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Luteal,
  },
  {
    sessionId: '4',
    scheduledDate: '2026-02-16',
    sessionName: 'Interval Training',
    oldDistance: 6,
    newDistance: 5,
    oldDuration: 45,
    newDuration: 40,
    oldWorkoutType: WorkoutType.Interval,
    newWorkoutType: WorkoutType.Tempo,
    oldIntensityLevel: IntensityLevel.High,
    newIntensityLevel: IntensityLevel.Moderate,
    cyclePhase: CyclePhase.Luteal,
  },
]

// Mock data spanning multiple months
const mockMultiMonthChanges: SessionChangeWithPhase[] = [
  {
    sessionId: '1',
    scheduledDate: '2026-02-26',
    sessionName: 'Easy Recovery Run',
    oldDistance: 5,
    newDistance: 4,
    oldDuration: 45,
    newDuration: 35,
    oldWorkoutType: WorkoutType.Easy,
    newWorkoutType: WorkoutType.Easy,
    oldIntensityLevel: IntensityLevel.Low,
    newIntensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Follicular,
  },
  {
    sessionId: '2',
    scheduledDate: '2026-02-28',
    sessionName: 'Tempo Run',
    oldDistance: 8,
    newDistance: 6,
    oldDuration: 50,
    newDuration: 40,
    oldWorkoutType: WorkoutType.Tempo,
    newWorkoutType: WorkoutType.Easy,
    oldIntensityLevel: IntensityLevel.High,
    newIntensityLevel: IntensityLevel.Moderate,
    cyclePhase: CyclePhase.Ovulatory,
  },
  {
    sessionId: '3',
    scheduledDate: '2026-03-02',
    sessionName: 'Long Run',
    oldDistance: 15,
    newDistance: 12,
    oldDuration: 100,
    newDuration: 80,
    oldWorkoutType: WorkoutType.Long,
    newWorkoutType: WorkoutType.Long,
    oldIntensityLevel: IntensityLevel.Moderate,
    newIntensityLevel: IntensityLevel.Low,
    cyclePhase: CyclePhase.Luteal,
  },
  {
    sessionId: '4',
    scheduledDate: '2026-03-05',
    sessionName: 'Interval Training',
    oldDistance: 6,
    newDistance: 5,
    oldDuration: 45,
    newDuration: 40,
    oldWorkoutType: WorkoutType.Interval,
    newWorkoutType: WorkoutType.Tempo,
    oldIntensityLevel: IntensityLevel.High,
    newIntensityLevel: IntensityLevel.Moderate,
    cyclePhase: CyclePhase.Luteal,
  },
]

// Simple Modal (existing implementation)
function SimpleRecalculationModal({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleDecline = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-petrona text-[32px] font-normal text-foreground">
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

// Detailed Modal with Session Changes
function DetailedRecalculationModal({
  open,
  onOpenChange,
  sessionChanges = mockSessionChanges
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionChanges?: SessionChangeWithPhase[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const handleDecline = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onOpenChange(false)
  }

  // Calculate summary stats
  const totalDistanceReduction = sessionChanges.reduce((acc, change) => {
    const oldDist = change.oldDistance ?? 0
    const newDist = change.newDistance ?? 0
    return acc + (oldDist - newDist)
  }, 0)

  const sessionsWithTypeChange = sessionChanges.filter(
    change => change.oldWorkoutType !== change.newWorkoutType
  ).length

  // Group sessions by month
  const sessionsByMonth = sessionChanges.reduce((acc, change) => {
    const date = new Date(change.scheduledDate)
    const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(change)
    return acc
  }, {} as Record<string, SessionChangeWithPhase[]>)

  const monthKeys = Object.keys(sessionsByMonth)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-petrona text-[32px] font-normal text-foreground">
            Adjust Your Training Plan?
          </DialogTitle>
          <DialogDescription>
            Based on your recent training, we recommend the following adjustments.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Summary Alert */}
          <Alert className="bg-muted border-border rounded-lg">
            <AlertDescription>
              <strong>{sessionChanges.length} sessions</strong> will be adjusted
              {totalDistanceReduction > 0 && (
                <span> with a total reduction of <strong>{Math.round(totalDistanceReduction)} mi</strong></span>
              )}
              {sessionsWithTypeChange > 0 && (
                <span>. <strong>{sessionsWithTypeChange}</strong> workout types will change.</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(sessionChanges[0]?.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <ArrowRight className="h-3 w-3" />
            <span>
              {new Date(sessionChanges[sessionChanges.length - 1]?.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Session Changes List - Grouped by Month */}
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
                      cyclePhase={change.cyclePhase}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border pt-4">
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

// Wrapper component for Storybook
function ModalWrapper({ variant, multiMonth = false }: { variant: 'simple' | 'detailed', multiMonth?: boolean }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-[600px] bg-background p-8">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      {variant === 'simple' ? (
        <SimpleRecalculationModal open={open} onOpenChange={setOpen} />
      ) : (
        <DetailedRecalculationModal
          open={open}
          onOpenChange={setOpen}
          sessionChanges={multiMonth ? mockMultiMonthChanges : mockSessionChanges}
        />
      )}
    </div>
  )
}

const meta: Meta<typeof ModalWrapper> = {
  title: 'Components/RecalculationModal',
  component: ModalWrapper,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof ModalWrapper>

export const Simple: Story = {
  args: {
    variant: 'simple',
  },
  render: () => <ModalWrapper variant="simple" />,
}

export const DetailedWithChanges: Story = {
  args: {
    variant: 'detailed',
  },
  render: () => <ModalWrapper variant="detailed" />,
}

export const DetailedMultiMonth: Story = {
  args: {
    variant: 'detailed',
    multiMonth: true,
  },
  render: () => <ModalWrapper variant="detailed" multiMonth={true} />,
}

// Individual CalendarDayChange cards story
function CalendarDayChangeWrapper() {
  return (
    <div className="bg-background p-8 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Session Change Cards (Calendar Style)</h3>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {mockSessionChanges.map((change) => (
          <CalendarDayChange
            key={change.sessionId}
            change={change}
            cyclePhase={change.cyclePhase}
          />
        ))}
      </div>
    </div>
  )
}

export const CalendarStyleChangeCards: Story = {
  render: () => <CalendarDayChangeWrapper />,
}
