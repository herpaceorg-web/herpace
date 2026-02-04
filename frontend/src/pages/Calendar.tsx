import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity, IntensityLevel, WorkoutType } from '@/types/api'
import type { PlanDetailResponse, ProfileResponse, SessionSummary, SessionDetailDto, CompleteSessionRequest } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { CompleteSessionDialog } from '@/components/session/CompleteSessionDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateCyclePhasesForRange, formatDateKey, getCyclePhaseColor } from '@/utils/cyclePhases'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { DayButton } from 'react-day-picker'
import { cn } from '@/lib/utils'
import * as React from 'react'

export default function Calendar() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cyclePhases, setCyclePhases] = useState<Map<string, CyclePhase>>(new Map())
  const [sessionsByDate, setSessionsByDate] = useState<Map<string, SessionSummary>>(new Map())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [planStartDate, setPlanStartDate] = useState<Date | null>(null)
  const [planEndDate, setPlanEndDate] = useState<Date | null>(null)

  // State for past session modal
  const [selectedPastSession, setSelectedPastSession] = useState<SessionDetailDto | null>(null)
  const [showPastSessionModal, setShowPastSessionModal] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch plan and profile in parallel
      const [planData, profileData] = await Promise.all([
        api.get<PlanDetailResponse>('/api/plans/active'),
        api.get<ProfileResponse>('/api/profiles/me')
      ])

      setPlan(planData)
      setProfile(profileData)

      // Set plan date range
      const startDate = new Date(planData.startDate)
      const endDate = new Date(planData.raceDate)
      setPlanStartDate(startDate)
      setPlanEndDate(endDate)

      // Initialize current month to the later of: today or plan start
      const today = new Date()
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const planStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      setCurrentMonth(new Date(Math.max(currentMonthStart.getTime(), planStartMonth.getTime())))

      // Calculate cycle phases if cycle tracking is enabled
      if (
        profileData.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
        profileData.cycleLength &&
        profileData.lastPeriodStart
      ) {
        const lastPeriodStart = new Date(profileData.lastPeriodStart)
        const cycleLength = profileData.cycleLength

        const phases = generateCyclePhasesForRange(
          startDate,
          endDate,
          lastPeriodStart,
          cycleLength
        )
        setCyclePhases(phases)
      }

      // Map sessions by date for quick lookup
      const sessionsMap = new Map<string, SessionSummary>()
      planData.sessions.forEach((session) => {
        const date = new Date(session.scheduledDate)
        const dateKey = formatDateKey(date)
        sessionsMap.set(dateKey, session)
      })
      setSessionsByDate(sessionsMap)
    } catch (err: unknown) {
      console.error('Failed to load calendar data:', err)
      setError('Failed to load training calendar. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  // Check if navigation buttons should be disabled
  const isPrevDisabled = planStartDate
    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) <=
      new Date(planStartDate.getFullYear(), planStartDate.getMonth(), 1)
    : false

  const isNextDisabled = planEndDate
    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) >=
      new Date(planEndDate.getFullYear(), planEndDate.getMonth(), 1)
    : false

  // Handle clicking on a past unmarked session
  const handleSessionClick = async (session: SessionSummary, sessionDate: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionDay = new Date(sessionDate)
    sessionDay.setHours(0, 0, 0, 0)

    const isPast = sessionDay < today
    const isUnmarked = !session.completedAt && !session.isSkipped

    // Only handle past unmarked sessions
    if (!isPast || !isUnmarked) {
      return
    }

    try {
      setIsLoadingSession(true)
      // Fetch full session details
      const sessionDetail = await api.get<SessionDetailDto>(`/api/sessions/${session.id}`)
      setSelectedPastSession(sessionDetail)
      setShowPastSessionModal(true)
    } catch (err) {
      console.error('Failed to load session details:', err)
    } finally {
      setIsLoadingSession(false)
    }
  }

  // Handle completing a past session
  const handleCompleteSession = async (data: CompleteSessionRequest) => {
    if (!selectedPastSession) return

    await api.put(`/api/sessions/${selectedPastSession.id}/complete`, data)

    // Update local state
    const dateKey = formatDateKey(new Date(selectedPastSession.scheduledDate))
    const updatedSessions = new Map(sessionsByDate)
    const existingSession = updatedSessions.get(dateKey)
    if (existingSession) {
      updatedSessions.set(dateKey, { ...existingSession, completedAt: new Date().toISOString() })
      setSessionsByDate(updatedSessions)
    }

    setShowCompleteDialog(false)
    setShowPastSessionModal(false)
    setSelectedPastSession(null)
  }

  // Handle skipping a past session
  const handleSkipSession = async () => {
    if (!selectedPastSession) return

    try {
      setIsSkipping(true)
      await api.put(`/api/sessions/${selectedPastSession.id}/skip`, {})

      // Update local state
      const dateKey = formatDateKey(new Date(selectedPastSession.scheduledDate))
      const updatedSessions = new Map(sessionsByDate)
      const existingSession = updatedSessions.get(dateKey)
      if (existingSession) {
        updatedSessions.set(dateKey, { ...existingSession, isSkipped: true })
        setSessionsByDate(updatedSessions)
      }

      setShowPastSessionModal(false)
      setSelectedPastSession(null)
    } catch (err) {
      console.error('Failed to skip session:', err)
    } finally {
      setIsSkipping(false)
    }
  }

  // Custom day renderer that shows session info and cycle phases
  const CustomDayButton = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<typeof DayButton>
  >(({ day, modifiers, ...props }, ref) => {
    const dateKey = formatDateKey(day.date)
    const session = sessionsByDate.get(dateKey)
    const cyclePhase = cyclePhases.get(dateKey)

    const hasSession = !!session
    const isRest = session?.workoutType === WorkoutType.Rest
    const isCompleted = !!session?.completedAt
    const isSkipped = !!session?.isSkipped

    // Determine if this is a past unmarked session (clickable)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sessionDay = new Date(day.date)
    sessionDay.setHours(0, 0, 0, 0)
    const isPast = sessionDay < today
    const isPastUnmarked = hasSession && isPast && !isCompleted && !isSkipped

    // Intensity colors and labels
    const intensityColors = {
      [IntensityLevel.Low]: 'bg-blue-500 text-white',
      [IntensityLevel.Moderate]: 'bg-yellow-500 text-white',
      [IntensityLevel.High]: 'bg-red-500 text-white',
    }

    const intensityLabels = {
      [IntensityLevel.Low]: 'Low Intensity',
      [IntensityLevel.Moderate]: 'Moderate Intensity',
      [IntensityLevel.High]: 'High Intensity',
    }

    // Cycle phase background
    const bgClass = cyclePhase !== undefined ? getCyclePhaseColor(cyclePhase) : 'bg-background'

    // Handle click for past unmarked sessions
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isPastUnmarked && session) {
        e.preventDefault()
        e.stopPropagation()
        handleSessionClick(session, day.date)
      }
    }

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          'h-auto w-full min-h-24 p-2 rounded-none border border-border relative block',
          bgClass,
          modifiers.outside && 'opacity-40',
          modifiers.today && 'ring-2 ring-primary ring-inset',
          isPastUnmarked && 'ring-2 ring-amber-500 ring-inset cursor-pointer',
          'hover:opacity-90'
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex flex-col items-start justify-start w-full">
          {/* Day number with status indicator */}
          <div className="w-full flex items-center gap-1 mb-1">
            <span className="text-sm font-medium">{day.date.getDate()}</span>
            {/* Status indicators */}
            {isCompleted && (
              <span className="text-green-600 text-sm font-bold" title="Completed">✓</span>
            )}
            {!isCompleted && isSkipped && (
              <span className="text-gray-500 text-sm" title="Skipped">–</span>
            )}
            {isPastUnmarked && (
              <span className="text-amber-600 text-sm font-bold" title="Needs update - click to mark">!</span>
            )}
          </div>

          {/* Session content stacked vertically */}
          {hasSession && (
            <div className="w-full flex flex-col gap-1">
              {/* Session name */}
              <p
                className={cn(
                  'text-sm font-semibold leading-tight text-left w-full',
                  isRest && 'text-gray-500',
                  !isRest && 'text-gray-900'
                )}
              >
                {session.sessionName}
              </p>

              {/* Duration and Distance (only for non-rest days) */}
              {!isRest && (session.durationMinutes || session.distance) && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  {session.durationMinutes && (
                    <span>{session.durationMinutes} min</span>
                  )}
                  {session.durationMinutes && session.distance && <span>•</span>}
                  {session.distance && (
                    <span>{session.distance} mi</span>
                  )}
                </div>
              )}

              {/* Intensity pill */}
              {!isCompleted && !isSkipped && !isRest && session.intensityLevel !== undefined && (
                <div
                  className={cn(
                    'px-2 py-1 rounded-full text-[10px] font-medium self-start mt-0.5',
                    intensityColors[session.intensityLevel]
                  )}
                  title={`Intensity: ${intensityLabels[session.intensityLevel]}`}
                >
                  {intensityLabels[session.intensityLevel]}
                </div>
              )}
            </div>
          )}
        </div>
      </Button>
    )
  })
  CustomDayButton.displayName = 'CustomDayButton'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No active training plan found.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasCycleTracking =
    profile?.typicalCycleRegularity !== CycleRegularity.DoNotTrack &&
    cyclePhases.size > 0

  // Format race date
  const raceDate = new Date(plan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // Format current month display
  const currentMonthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Training Calendar</h1>
        <p className="text-lg opacity-90">
          {plan.planName} • {plan.raceName} on {raceDate}
        </p>
      </div>

      {/* Cycle Phase Legend */}
      {hasCycleTracking && <CyclePhaseLegend />}

      {/* Calendar with Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentMonthLabel}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                disabled={isPrevDisabled}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={isNextDisabled}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            components={{
              DayButton: CustomDayButton as any,
            }}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Loading indicator for session fetch */}
      {isLoadingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading session...</span>
          </div>
        </div>
      )}

      {/* Past session modal - choice between complete and skip */}
      <Dialog open={showPastSessionModal} onOpenChange={setShowPastSessionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Past Workout</DialogTitle>
            <DialogDescription>
              This workout was scheduled for{' '}
              {selectedPastSession && new Date(selectedPastSession.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
              . How would you like to mark it?
            </DialogDescription>
          </DialogHeader>

          {selectedPastSession && (
            <div className="py-4 space-y-3">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedPastSession.sessionName}</h3>
                {selectedPastSession.sessionDescription && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedPastSession.sessionDescription}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm">
                  {selectedPastSession.durationMinutes && (
                    <span>{selectedPastSession.durationMinutes} min</span>
                  )}
                  {selectedPastSession.distance && (
                    <span>{selectedPastSession.distance} km</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPastSessionModal(false)
                setSelectedPastSession(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleSkipSession}
              disabled={isSkipping}
            >
              {isSkipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Skipping...
                </>
              ) : (
                'I Skipped This Workout'
              )}
            </Button>
            <Button
              onClick={() => {
                setShowPastSessionModal(false)
                setShowCompleteDialog(true)
              }}
            >
              I Completed This Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete session dialog */}
      {selectedPastSession && (
        <CompleteSessionDialog
          session={selectedPastSession}
          open={showCompleteDialog}
          onOpenChange={(open) => {
            setShowCompleteDialog(open)
            if (!open) {
              setSelectedPastSession(null)
            }
          }}
          onComplete={handleCompleteSession}
        />
      )}
    </div>
  )
}
