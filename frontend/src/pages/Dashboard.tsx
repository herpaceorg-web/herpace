import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import type { PlanSummaryDto, SessionDetailDto, UpcomingSessionsResponse, ProfileResponse, CyclePositionDto, PlanDetailResponse, SessionSummary } from '@/types/api'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { SessionChangeCard } from '@/components/session/SessionChangeCard'
import { HormoneCycleChart } from '@/components/HormoneCycleChart'
import { WeekView } from '@/components/calendar/WeekView'
import type { CalendarView, DisplayMode } from '@/components/calendar/WeekView'
import { MonthViewInline } from '@/components/calendar/MonthViewInline'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Sparkles, LayoutGrid, List, ChevronLeft, ChevronRight, Calendar, Timer, Goal, Check, Route } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'
import { getWeekStart, calculateWeekSummary } from '@/utils/weekUtils'
import { generateCyclePhasesForRange } from '@/utils/cyclePhases'
import { Badge } from '@/components/ui/badge'
import { PunchCard, PunchCardDay, PunchCardVariant } from '@/components/ui/punch-card'
import { WorkoutType } from '@/types/api'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TrainingStage } from '@/types/api'
import { CyclePhase } from '@/types/api'
import { TRAINING_STAGES } from '@/lib/trainingStages'

export function Dashboard() {
  const navigate = useNavigate()
  const [planSummary, setPlanSummary] = useState<PlanSummaryDto | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDetailDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('mi')
  const [cyclePosition, setCyclePosition] = useState<CyclePositionDto | null>(null)
  const prevRecalculationState = useRef<boolean>(false)

  // WeekView state
  const [plan, setPlan] = useState<PlanDetailResponse | null>(null)

  // View mode state
  const [activeView, setActiveView] = useState<CalendarView>('week')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

  // Selected session state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
  const [selectedSessionMonth, setSelectedSessionMonth] = useState<string | null>(null) // Format: "YYYY-MM"
  const selectedSessionRef = useRef<HTMLDivElement>(null)

  // Month view navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Live countdown state
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null)

  // Update countdown every minute
  useEffect(() => {
    if (!planSummary?.raceDate) return

    const calculateCountdown = () => {
      const now = new Date()
      const raceDate = new Date(planSummary.raceDate)
      const diff = raceDate.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setCountdown({ days, hours, minutes })
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [planSummary?.raceDate])

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for recalculation status when pending (optimized - only fetches plan summary)
  useEffect(() => {
    if (!planSummary?.hasPendingRecalculation) {
      prevRecalculationState.current = false
      return
    }

    const pollInterval = setInterval(() => {
      pollPlanSummary()
    }, 8000) // Poll every 8 seconds (less aggressive than 5s)

    return () => clearInterval(pollInterval)
  }, [planSummary?.hasPendingRecalculation])

  // Detect when recalculation completes and refresh all data once
  useEffect(() => {
    const wasRecalculating = prevRecalculationState.current
    const isRecalculating = planSummary?.hasPendingRecalculation ?? false

    // If we were recalculating and now we're done, refresh everything
    if (wasRecalculating && !isRecalculating) {
      loadDashboardData()
    }

    prevRecalculationState.current = isRecalculating
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSummary?.hasPendingRecalculation])

  // Show summary modal when recalculation completes
  useEffect(() => {
    if (planSummary?.recalculationSummary && !showSummaryModal) {
      setShowSummaryModal(true)
    }
  }, [planSummary?.recalculationSummary])


  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get client's local date in ISO format (YYYY-MM-DD)
      // Note: Don't use toISOString() as it converts to UTC which may be a different day
      const now = new Date()
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // Load plan summary, upcoming sessions, profile, cycle position, and full plan in parallel
      // Cycle position returns 404 for DoNotTrack users — catch and treat as null
      // Profile returns 404 if user hasn't completed onboarding — catch and treat as null
      const [summary, sessionsResponse, profile, cyclePos, planData] = await Promise.all([
        api.get<PlanSummaryDto>(`/api/sessions/plan-summary?clientDate=${clientDate}`),
        api.get<UpcomingSessionsResponse>(`/api/sessions/upcoming?count=7&clientDate=${clientDate}`),
        api.get<ProfileResponse>('/api/profiles/me').catch(() => null),
        api.get<CyclePositionDto>(`/api/cycle/position?clientDate=${clientDate}`).catch(() => null),
        api.get<PlanDetailResponse>('/api/plans/active').catch(() => null) // For WeekView preview
      ])

      // Sanity-check: if the backend returned a todaysSession whose date doesn't
      // match the client's local date, discard it rather than showing stale data.
      if (summary.todaysSession) {
        const sessionDateStr = summary.todaysSession.scheduledDate.slice(0, 10)
        if (sessionDateStr !== clientDate) {
          // eslint-disable-next-line no-console
          console.warn.call(console,
            `plan-summary returned todaysSession dated ${sessionDateStr} but client date is ${clientDate} — discarding`
          )
          summary.todaysSession = undefined
        }
      }

      // Be defensive about response shape so one malformed payload
      // doesn't crash rendering with a white screen.
      const sessionsPayload = sessionsResponse as unknown as {
        sessions?: SessionDetailDto[]
        Sessions?: SessionDetailDto[]
      }
      const normalizedSessions = Array.isArray(sessionsPayload.sessions)
        ? sessionsPayload.sessions
        : Array.isArray(sessionsPayload.Sessions)
          ? sessionsPayload.Sessions
          : []

      if (!Array.isArray(sessionsPayload.sessions) && !Array.isArray(sessionsPayload.Sessions)) {
        // eslint-disable-next-line no-console
        console.warn.call(console, 'Unexpected /api/sessions/upcoming response shape', sessionsResponse)
      }

      setPlanSummary(summary)
      setUpcomingSessions(normalizedSessions)
      setDistanceUnit(profile?.distanceUnit === 1 ? 'mi' : 'km')
      setCyclePosition(cyclePos)

      // NEW: Set up WeekView data if plan is available
      if (planData) {
        setPlan(planData)
      }

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number, data?: { message?: string } } }
        if (axiosError.response?.status === 404) {
          setError('No active training plan found. Please create a race goal to generate a plan.')
        } else {
          setError(axiosError.response?.data?.message || 'Failed to load dashboard data.')
        }
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Lightweight polling function - only fetches plan summary to check recalculation status
  // This avoids the jarring "refresh" feeling by not re-fetching all data or showing loading state
  const pollPlanSummary = async () => {
    try {
      const now = new Date()
      const clientDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      const summary = await api.get<PlanSummaryDto>(`/api/sessions/plan-summary?clientDate=${clientDate}`)

      // Sanity-check for today's session
      if (summary.todaysSession) {
        const sessionDateStr = summary.todaysSession.scheduledDate.slice(0, 10)
        if (sessionDateStr !== clientDate) {
          summary.todaysSession = undefined
        }
      }

      setPlanSummary(summary)
    } catch (err) {
      // Silently fail during polling - don't disrupt the user experience
      // The main loadDashboardData will handle errors on initial load
      // eslint-disable-next-line no-console
      console.error.call(console, 'Poll failed:', err)
    }
  }

  const handleDismissSummary = async () => {
    try {
      await api.post('/api/sessions/dismiss-summary', {})
      setShowSummaryModal(false)
      // Refresh to clear the summary from planSummary
      await loadDashboardData()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error.call(console, 'Failed to dismiss summary:', err)
      // Still close the modal even if API call fails
      setShowSummaryModal(false)
    }
  }


  // Memoize handlers to prevent unnecessary re-renders
  const handlePeriodLogged = useCallback((updated: CyclePositionDto) => {
    setCyclePosition(updated)
  }, [])

  // WeekView calculations
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  const weekSessions = useMemo(() => {
    if (!plan) return []
    return plan.sessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return sessionDate >= weekStart && sessionDate <= weekEnd
    })
  }, [plan, weekStart])

  // Get sessions for list view based on current activeView
  const listSessions = useMemo(() => {
    if (!plan) return []

    let sessions: SessionSummary[]
    if (activeView === 'week') {
      sessions = weekSessions
    } else if (activeView === 'month') {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      sessions = plan.sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate)
        return sessionDate >= monthStart && sessionDate <= monthEnd
      })
    } else {
      // Plan view - all sessions
      sessions = plan.sessions
    }

    // Sort by date
    return sessions
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }, [plan, activeView, weekSessions, currentMonth])

  const weekSummary = useMemo(() => {
    if (!plan) return null
    return calculateWeekSummary(
      weekSessions,
      weekStart,
      new Date(plan.startDate),
      distanceUnit,
      new Date(plan.endDate)
    )
  }, [weekSessions, weekStart, plan, distanceUnit])

  // Create punch card data for the week - based on actual sessions, numbered sequentially
  const punchCardDays = useMemo((): PunchCardDay[] => {
    // Filter out rest days and sort by date
    const activeSessions = weekSessions
      .filter(s => s.workoutType !== WorkoutType.Rest)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

    // Number sessions sequentially (1, 2, 3, etc.)
    return activeSessions.map((session, index) => ({
      dayNumber: index + 1,
      hasSession: true,
      isCompleted: !!session.completedAt,
      isSkipped: session.isSkipped ?? false,
      isRest: false
    }))
  }, [weekSessions])

  // Create punch card data based on active view
  const displayPunchCardData = useMemo((): { days: PunchCardDay[], variant: PunchCardVariant } => {
    if (activeView === 'week') {
      return { days: punchCardDays, variant: 'default' }
    }

    // For month and plan views, use compact variant with the appropriate sessions
    const sessions = activeView === 'month' ? (() => {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      return plan?.sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate)
        return sessionDate >= monthStart && sessionDate <= monthEnd
      }) ?? []
    })() : (plan?.sessions ?? [])

    const days: PunchCardDay[] = sessions.map((session, index) => ({
      dayNumber: index + 1,
      hasSession: true,
      isCompleted: !!session.completedAt,
      isSkipped: session.isSkipped ?? false,
      isRest: session.workoutType === WorkoutType.Rest
    }))

    return { days, variant: 'compact' }
  }, [activeView, punchCardDays, currentMonth, plan])

  // Calculate last week's mileage for comparison
  const lastWeekMileage = useMemo(() => {
    if (!plan) return null
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const lastWeekSessions = plan.sessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
      return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd
    })

    let totalMiles = 0
    lastWeekSessions.forEach(session => {
      if (session.distance) {
        const miles = distanceUnit === 'km' ? session.distance * 0.621371 : session.distance
        totalMiles += miles
      }
    })

    return Math.round(totalMiles * 10) / 10
  }, [plan, weekStart, distanceUnit])

  // Update cycle phases to cover month range when in month view
  // Get all months in the plan (for Plan view)
  const planMonths = useMemo(() => {
    if (!plan) return []
    const months: Date[] = []
    const start = new Date(plan.startDate)
    const end = new Date(plan.endDate)

    let current = new Date(start.getFullYear(), start.getMonth(), 1)
    while (current <= end) {
      months.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }
    return months
  }, [plan])

  const displayedCyclePhases = useMemo(() => {
    if (!cyclePosition) return new Map<string, CyclePhase>()

    let rangeStart: Date, rangeEnd: Date
    if (activeView === 'plan' && plan) {
      rangeStart = new Date(plan.startDate)
      rangeEnd = new Date(plan.endDate)
    } else if (activeView === 'month') {
      rangeStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      rangeEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    } else {
      rangeStart = weekStart
      rangeEnd = new Date(weekStart)
      rangeEnd.setDate(rangeEnd.getDate() + 6)
    }

    return generateCyclePhasesForRange(
      rangeStart,
      rangeEnd,
      new Date(cyclePosition.lastPeriodStart),
      cyclePosition.cycleLength
    )
  }, [cyclePosition, weekStart, activeView, currentMonth, plan])

  // Handle day click - show session details
  const handleDayClick = useCallback(async (date: Date, session?: SessionSummary) => {
    // Toggle: if clicking same session, deselect
    if (session && selectedSessionId === session.id) {
      setSelectedSessionId(null)
      setSelectedSession(null)
      setSelectedSessionMonth(null)
      return
    }

    if (!session) {
      setSelectedSessionId(null)
      setSelectedSession(null)
      setSelectedSessionMonth(null)
      return
    }

    setSelectedSessionId(session.id)
    // Track which month the selected session belongs to (for Plan view)
    setSelectedSessionMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)

    // Try to find full details in upcomingSessions first
    const existingDetails = upcomingSessions.find(s => s.id === session.id)
    if (existingDetails) {
      setSelectedSession(existingDetails)
    } else {
      // Fetch full session details from API
      try {
        const details = await api.get<SessionDetailDto>(`/api/sessions/${session.id}`)
        setSelectedSession(details)
      } catch (err) {
        console.error('Failed to load session details:', err)
        setSelectedSession(null)
      }
    }

    // Scroll to selected session card
    setTimeout(() => {
      selectedSessionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }, [selectedSessionId, upcomingSessions])

  // Handle month navigation
  const handleNavigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newMonth
    })
  }, [])

  // Handle week navigation
  const handleNavigateWeek = useCallback((direction: 'prev' | 'next') => {
    setWeekStart(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
      return newWeek
    })
  }, [])

  // Navigation boundary checks
  const canNavigatePrev = useMemo(() => {
    if (!plan) return false
    const planStart = new Date(plan.startDate)
    if (activeView === 'week') {
      return weekStart > getWeekStart(planStart)
    } else {
      return currentMonth.getFullYear() > planStart.getFullYear() ||
        (currentMonth.getFullYear() === planStart.getFullYear() && currentMonth.getMonth() > planStart.getMonth())
    }
  }, [plan, activeView, weekStart, currentMonth])

  const canNavigateNext = useMemo(() => {
    if (!plan) return false
    const planEnd = new Date(plan.endDate)
    if (activeView === 'week') {
      return weekStart < getWeekStart(planEnd)
    } else {
      return currentMonth.getFullYear() < planEnd.getFullYear() ||
        (currentMonth.getFullYear() === planEnd.getFullYear() && currentMonth.getMonth() < planEnd.getMonth())
    }
  }, [plan, activeView, weekStart, currentMonth])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/onboarding')}>
          Create Training Plan
        </Button>
      </div>
    )
  }

  if (!planSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to HerPace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You don't have an active training plan yet. Create a race goal to get started!
          </p>
          <Button onClick={() => navigate('/onboarding')}>
            Create Training Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Recalculation status banner */}
      {planSummary?.hasPendingRecalculation && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="ml-2">
            <div className="font-medium mb-1">Adapting Your Training Plan</div>
            <p className="text-sm text-muted-foreground">
              We've noticed your training has been a bit different than the plan. We're building you a personalized update to better match where you are right now. This usually takes just a minute or two.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Hormone Cycle Chart */}
      <HormoneCycleChart
        cyclePosition={cyclePosition}
        onPeriodLogged={handlePeriodLogged}
      />

      {/* Divider */}
      <div className="w-full lg:w-[85%] mx-auto mt-[48px] border-t border-border" />

      {/* Calendar View */}
      {plan && (
        <div className="w-full lg:w-[85%] mx-auto mt-[48px] pb-64">
          {/* Header row: Title + Date Navigation + View Controls */}
          <div className="flex items-center justify-between mb-[48px]">
            {/* Title */}
            <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona'] min-w-0 flex-shrink">
              {plan.raceName.includes('Marathon') ? 'Marathon' : plan.raceName.includes('Half') ? 'Half Marathon' : plan.raceName} Training Plan
            </h2>

            {/* Date Navigation - hidden in plan view since all dates are shown */}
            {activeView !== 'plan' && (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canNavigatePrev}
                  onClick={() => activeView === 'week' ? handleNavigateWeek('prev') : handleNavigateMonth('prev')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-[24px] font-normal font-[family-name:'Petrona'] min-w-[200px] text-center">
                  {activeView === 'week' ? (
                    <>
                      {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </>
                  ) : (
                    currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  )}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canNavigateNext}
                  onClick={() => activeView === 'week' ? handleNavigateWeek('next') : handleNavigateMonth('next')}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* View Controls */}
            <div className="flex items-center gap-3">
              {/* Display Mode Toggle (Calendar/List) */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setDisplayMode('calendar')}
                  className={cn(
                    'p-2 rounded-md transition-all duration-300 ease-in-out',
                    displayMode === 'calendar'
                      ? 'bg-[#FDFBF7] shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Calendar view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-all duration-300 ease-in-out',
                    displayMode === 'list'
                      ? 'bg-[#FDFBF7] shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Week/Month/Plan Toggle */}
              <SegmentedControl
                options={[
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: 'plan', label: 'Plan' }
                ]}
                value={activeView}
                onValueChange={(value) => setActiveView(value as CalendarView)}
              />
            </div>
          </div>

          {/* Race/Goal and Summary Containers - Side by Side */}
          <div className="flex gap-4 mb-[48px]">
            {/* Race and Goal Container */}
            <div className="w-1/2 p-4 bg-card rounded-lg border border-border shadow-sm">
              <div className="space-y-4">
                <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: {planSummary.raceName}</h3>
                <div className="flex items-center gap-4 text-sm text-[#696863] font-normal">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(planSummary.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="h-4 border-l border-border" />
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>
                      {countdown
                        ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m until race day`
                        : `${planSummary.daysUntilRace} days until race day`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
                    <Goal className="w-4 h-4" />
                    <span>Goal: Finish strong</span>
                  </div>
                  <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
                    <Check className="w-4 h-4" />
                    On track
                  </Badge>
                </div>
              </div>
            </div>

            {/* Week Summary Container */}
            {weekSummary && (
              <div className="w-1/2 p-4 bg-card rounded-lg border border-border shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training Summary</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal font-[family-name:'Manrope']">Week {weekSummary.weekNumber} of {weekSummary.totalWeeksInPlan}</span>
                    <span className="text-sm text-[#696863] font-normal">{weekSummary.completionPercentage}%</span>
                  </div>

                  {/* Segmented Progress Bar with Stages */}
                  <div className="relative">
                    {/* Background segments */}
                    <div className="flex h-2 rounded-full overflow-hidden">
                      {[
                        { stage: TrainingStage.Base, width: 25 },
                        { stage: TrainingStage.Build, width: 35 },
                        { stage: TrainingStage.Peak, width: 25 },
                        { stage: TrainingStage.Taper, width: 15 }
                      ].map((segment) => {
                        const isActive = weekSummary.trainingStage === segment.stage
                        return (
                          <div
                            key={segment.stage}
                            className={cn(
                              'h-full',
                              isActive ? 'bg-muted' : 'bg-muted/50'
                            )}
                            style={{ width: `${segment.width}%` }}
                          />
                        )
                      })}
                    </div>

                    {/* Progress fill overlay */}
                    <div
                      className="absolute top-0 left-0 h-2 bg-primary rounded-l-full transition-all"
                      style={{
                        width: `${weekSummary.completionPercentage}%`,
                        borderRadius: weekSummary.completionPercentage >= 100 ? '9999px' : undefined
                      }}
                    />

                    {/* Stage divider lines */}
                    {[25, 60, 85].map((position) => (
                      <div
                        key={position}
                        className="absolute w-0.5 bg-foreground"
                        style={{ left: `${position}%`, top: '-4px', height: 'calc(100% + 8px)' }}
                      />
                    ))}
                  </div>

                  {/* Stage labels */}
                  <div className="flex mt-4">
                    {[
                      { stage: TrainingStage.Base, label: 'Base', width: 25 },
                      { stage: TrainingStage.Build, label: 'Build', width: 35 },
                      { stage: TrainingStage.Peak, label: 'Peak', width: 25 },
                      { stage: TrainingStage.Taper, label: 'Taper', width: 15 }
                    ].map((segment) => {
                      const stageInfo = TRAINING_STAGES[segment.stage]
                      return (
                        <div
                          key={segment.stage}
                          className="text-center"
                          style={{ width: `${segment.width}%` }}
                        >
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-sm text-[#696863] font-normal hover:text-[#3d3826] transition-colors cursor-pointer underline decoration-[#c5c2b8]">
                                {segment.label}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 bg-[#fcf9f3] border-[#ebe8e2]" align="center">
                              <div className="space-y-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#3d3826]">
                                    {stageInfo.name} — {stageInfo.tagline}
                                  </h4>
                                  <p className="text-xs text-[#85837d] mt-1 leading-relaxed">{stageInfo.description}</p>
                                </div>
                                <div className="border-t border-[#ebe8e2] pt-2 space-y-1.5">
                                  <p className="text-xs text-[#696863]"><span className="font-medium">Focus:</span> {stageInfo.focus}</p>
                                  <p className="text-xs text-[#696863]"><span className="font-medium">What to expect:</span> {stageInfo.whatToExpect}</p>
                                  <p className="text-xs text-[#696863]"><span className="font-medium">Tip:</span> {stageInfo.tip}</p>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-start text-sm text-[#696863] font-normal pt-4 border-t border-border">
                    <div className="flex items-center gap-2 shrink-0">
                      <PunchCard days={displayPunchCardData.days} variant={displayPunchCardData.variant} />
                      {activeView === 'week' && (
                        <span>{weekSummary.completedSessions}/{weekSummary.totalSessions} sessions</span>
                      )}
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="h-4 border-l border-border" />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Route className="w-5 h-5 text-[#696863]" />
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-foreground">{weekSummary.totalMiles} {distanceUnit}</span>
                        <span className="text-sm text-[#696863] font-normal">
                          this week
                          {lastWeekMileage !== null && lastWeekMileage > 0 && (
                            (() => {
                              const change = ((weekSummary.totalMiles - lastWeekMileage) / lastWeekMileage) * 100
                              const roundedChange = Math.round(change)
                              if (roundedChange > 0) {
                                return ` (+${roundedChange}%)`
                              } else if (roundedChange < 0) {
                                return ` (${roundedChange}%)`
                              }
                              return ' (0%)'
                            })()
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-[48px]" />

          {/* Calendar View */}
          {displayMode === 'calendar' && (
            <>
              {activeView === 'week' && (
                <WeekView
                  sessions={weekSessions}
                  weekStart={weekStart}
                  cyclePhases={displayedCyclePhases}
                  distanceUnit={distanceUnit}
                  planStartDate={new Date(plan.startDate)}
                  planEndDate={new Date(plan.endDate)}
                  planName={plan.raceName}
                  onDayClick={handleDayClick}
                  isExpanded={false}
                  onToggleExpand={() => setActiveView('month')}
                  activeView={activeView}
                  onViewChange={(view) => setActiveView(view as CalendarView)}
                  selectedSessionId={selectedSessionId ?? undefined}
                  displayMode={displayMode}
                  onDisplayModeChange={setDisplayMode}
                  showControls={false}
                  showSummary={false}
                />
              )}

              {activeView === 'month' && (
                <MonthViewInline
                  currentMonth={currentMonth}
                  sessions={plan.sessions}
                  cyclePhases={displayedCyclePhases}
                  onDayClick={handleDayClick}
                  planStartDate={new Date(plan.startDate)}
                  planEndDate={new Date(plan.endDate)}
                  selectedSessionId={selectedSessionId ?? undefined}
                />
              )}

              {activeView === 'plan' && (
                <div className="space-y-12">
                  {planMonths.map((month, index) => {
                    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
                    const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    const isSelectedMonth = selectedSessionMonth === monthKey

                    return (
                      <div key={monthKey}>
                        {/* Divider between months */}
                        {index > 0 && <div className="border-t border-border mb-12" />}

                        {/* Month label */}
                        <h3 className="text-xl font-normal font-[family-name:'Petrona'] mb-4">{monthLabel}</h3>

                        {/* Month grid */}
                        <MonthViewInline
                          currentMonth={month}
                          sessions={plan.sessions}
                          cyclePhases={displayedCyclePhases}
                          onDayClick={handleDayClick}
                          planStartDate={new Date(plan.startDate)}
                          planEndDate={new Date(plan.endDate)}
                          selectedSessionId={selectedSessionId ?? undefined}
                        />

                        {/* Selected Session Details - shown below this month if session is in this month */}
                        {selectedSession && isSelectedMonth && (
                          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-[85%] mx-auto">
                            <WorkoutSessionCard
                              session={selectedSession}
                              onSessionUpdated={() => {
                                loadDashboardData()
                                setSelectedSession(null)
                                setSelectedSessionId(null)
                                setSelectedSessionMonth(null)
                              }}
                              distanceUnit={distanceUnit}
                              pendingConfirmation={planSummary?.pendingConfirmation}
                              recalculationPreview={planSummary?.recalculationPreview}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Session Details - for week and month views */}
              {selectedSession && activeView !== 'plan' && (
                <div ref={selectedSessionRef} className="mt-8 w-full lg:w-[85%] mx-auto">
                  <WorkoutSessionCard
                    session={selectedSession}
                    onSessionUpdated={() => {
                      loadDashboardData()
                      setSelectedSession(null)
                      setSelectedSessionId(null)
                    }}
                    distanceUnit={distanceUnit}
                    pendingConfirmation={planSummary?.pendingConfirmation}
                    recalculationPreview={planSummary?.recalculationPreview}
                  />
                </div>
              )}
            </>
          )}

          {/* List View */}
          {displayMode === 'list' && (
            <div className="space-y-6">
              {listSessions.map((session, index) => {
                const sessionDate = new Date(session.scheduledDate)
                const sessionMonth = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`
                const prevSession = index > 0 ? listSessions[index - 1] : null
                const prevSessionDate = prevSession ? new Date(prevSession.scheduledDate) : null
                const prevMonth = prevSessionDate ? `${prevSessionDate.getFullYear()}-${prevSessionDate.getMonth()}` : null
                const isNewMonth = sessionMonth !== prevMonth

                return (
                  <div key={session.id}>
                    {/* Month label */}
                    {isNewMonth && (
                      <div className="w-full lg:w-[85%] mx-auto mb-4">
                        {index > 0 && <div className="border-t border-border mb-6 mt-6" />}
                        <h3 className="text-xl font-normal font-[family-name:'Petrona']">
                          {sessionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                      </div>
                    )}
                    <div className="w-full lg:w-[85%] mx-auto">
                      <WorkoutSessionCard
                        session={session as SessionDetailDto}
                        onSessionUpdated={() => {
                          loadDashboardData()
                        }}
                        distanceUnit={distanceUnit}
                        pendingConfirmation={planSummary?.pendingConfirmation}
                        recalculationPreview={planSummary?.recalculationPreview}
                      />
                    </div>
                  </div>
                )
              })}
              {listSessions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No training sessions in this time period.
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Recalculation summary modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Training Plan Has Been Updated
            </DialogTitle>
            <DialogDescription>
              Based on your recent training, we've adapted your plan to better support your goals.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm whitespace-pre-line">
              {planSummary?.recalculationSummary}
            </p>

            {/* Before/After comparison */}
            {planSummary?.latestAdaptation?.sessionChanges && planSummary.latestAdaptation.sessionChanges.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">What Changed</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {planSummary.latestAdaptation.sessionChanges
                    .filter(change => {
                      // Only show sessions that actually changed
                      return change.oldDistance !== change.newDistance ||
                             change.oldDuration !== change.newDuration ||
                             change.oldWorkoutType !== change.newWorkoutType ||
                             change.oldIntensityLevel !== change.newIntensityLevel
                    })
                    .map(change => (
                      <SessionChangeCard key={change.sessionId} change={change} />
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleDismissSummary}>Got It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
