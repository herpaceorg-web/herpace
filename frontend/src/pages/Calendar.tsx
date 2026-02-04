import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { CyclePhase, CycleRegularity, WorkoutType } from '@/types/api'
import type { PlanDetailResponse, ProfileResponse, SessionSummary, SessionDetailDto } from '@/types/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CalendarDay } from '@/components/calendar/CalendarDay'
import { CyclePhaseLegend } from '@/components/calendar/CyclePhaseLegend'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { generateCyclePhasesForRange, formatDateKey } from '@/utils/cyclePhases'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null)
  const [weekSessions, setWeekSessions] = useState<SessionDetailDto[]>([])
  const [isLoadingWeek, setIsLoadingWeek] = useState(false)
  const weekSectionsRef = useRef<HTMLDivElement>(null)

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

  // Get the Sunday of the week for a given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day // Sunday = 0, so diff to Sunday is just the day value
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Handle clicking a calendar day
  const handleDayClick = async (date: Date) => {
    const weekStart = getWeekStart(date)
    setSelectedWeekStart(weekStart)
    setIsLoadingWeek(true)

    try {
      // Get all session IDs for the week
      const sessionsInWeek: string[] = []

      // Iterate through the week (7 days) and collect session IDs
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart)
        currentDate.setDate(weekStart.getDate() + i)
        const dateKey = formatDateKey(currentDate)
        const session = sessionsByDate.get(dateKey)
        if (session) {
          sessionsInWeek.push(session.id)
        }
      }

      // Fetch detailed session data for all sessions in the week
      const detailedSessions = await Promise.all(
        sessionsInWeek.map(id => api.get<SessionDetailDto>(`/api/sessions/${id}`))
      )

      // Sort by scheduled date
      detailedSessions.sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      )

      setWeekSessions(detailedSessions)

      // Scroll to weekly sessions section after a brief delay to ensure rendering
      setTimeout(() => {
        weekSectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (error) {
      console.error('Failed to load week sessions:', error)
      setWeekSessions([])
    } finally {
      setIsLoadingWeek(false)
    }
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

  // Generate days for current month view
  const generateMonthDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []

    // Add empty cells for days before month starts (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const monthDays = generateMonthDays()
  const hasCycleTracking = profile?.typicalCycleRegularity !== CycleRegularity.DoNotTrack && cyclePhases.size > 0

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

  const raceDate = new Date(plan.raceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  const currentMonthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <Card className="max-w-none">
        <CardHeader>
          <div className="space-y-4">
            {/* Plan info */}
            <div>
              <h1 className="text-2xl font-petrona text-foreground mb-1">Training Calendar</h1>
              <p className="text-xs font-normal" style={{ color: '#696863' }}>
                {plan.planName} • {plan.raceName} on {raceDate}
              </p>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-petrona text-foreground">{currentMonthLabel}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  disabled={isPrevDisabled}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={isNextDisabled}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cycle Phase Legend - centered, below month and above weekday labels */}
          {hasCycleTracking && (
            <div className="flex justify-center py-2">
              <CyclePhaseLegend />
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-normal p-2" style={{ color: '#696863' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid with CalendarDay components */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />
              }

              const dateKey = formatDateKey(date)
              const session = sessionsByDate.get(dateKey)
              const cyclePhase = cyclePhases.get(dateKey)

              return (
                <CalendarDay
                  key={dateKey}
                  dayNumber={date.getDate()}
                  sessionName={session?.sessionName}
                  distance={session?.distance}
                  durationMinutes={session?.durationMinutes}
                  intensityLevel={session?.intensityLevel}
                  workoutType={session?.workoutType}
                  cyclePhase={cyclePhase}
                  isRest={session?.workoutType === WorkoutType.Rest}
                  zone={session?.cyclePhase !== undefined ? `Zone ${session.cyclePhase}` : undefined}
                  onClick={() => handleDayClick(date)}
                />
              )
            })}
          </div>

          {/* Weekly Sessions Display */}
          {selectedWeekStart && (
            <div ref={weekSectionsRef} className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-petrona text-foreground">
                  Week of {selectedWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedWeekStart(null)
                    setWeekSessions([])
                  }}
                >
                  Close
                </Button>
              </div>

              {isLoadingWeek ? (
                <div className="space-y-4">
                  <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
                  <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
                </div>
              ) : weekSessions.length > 0 ? (
                <div className="space-y-6">
                  {weekSessions.map((session) => (
                    <WorkoutSessionCard
                      key={session.id}
                      session={session}
                      onSessionUpdated={loadCalendarData}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No training sessions scheduled for this week.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  )
}
