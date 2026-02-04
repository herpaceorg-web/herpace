import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity, IntensityLevel, WorkoutType } from '@/types/api'
import type { PlanDetailResponse, ProfileResponse, SessionSummary } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { generateCyclePhasesForRange, formatDateKey, getCyclePhaseColor } from '@/utils/cyclePhases'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          'h-auto w-full min-h-24 p-2 rounded-none border border-border relative block',
          bgClass,
          modifiers.outside && 'opacity-40',
          modifiers.today && 'ring-2 ring-primary ring-inset',
          'hover:opacity-90'
        )}
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
    </div>
  )
}
