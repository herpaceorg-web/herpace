import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { HormoneCycleChart } from '@/components/HormoneCycleChart'
import { WeekView } from '@/components/calendar/WeekView'
import type { CalendarView, DisplayMode } from '@/components/calendar/WeekView'
import { MonthViewInline } from '@/components/calendar/MonthViewInline'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PunchCard, PunchCardDay } from '@/components/ui/punch-card'
import { CountdownDisplay } from '@/components/ui/countdown-display'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { cn } from '@/lib/utils'
import { Loader2, LayoutGrid, List, Goal, Check, ChevronLeft, ChevronRight, Calendar, Timer, Route, Target, Eye, Lightbulb } from 'lucide-react'
import { ToastProvider } from '@/contexts/ToastContext'
import { getWeekStart, calculateWeekSummary } from '@/utils/weekUtils'
import { generateCyclePhasesForRange, formatDateKey } from '@/utils/cyclePhases'
import {
  CyclePhase,
  WorkoutType,
  IntensityLevel,
  TrainingStage,
  PlanStatus
} from '@/types/api'
import type {
  PlanSummaryDto,
  SessionDetailDto,
  CyclePositionDto,
  PlanDetailResponse,
  SessionSummary
} from '@/types/api'

// Mock data generators
const generateMockSessions = (startDate: Date, weeks: number = 16): SessionSummary[] => {
  const sessions: SessionSummary[] = []
  const workoutTypes = [
    { type: WorkoutType.Easy, name: 'Easy Run', intensity: IntensityLevel.Low },
    { type: WorkoutType.Long, name: 'Long Run', intensity: IntensityLevel.Moderate },
    { type: WorkoutType.Tempo, name: 'Tempo Run', intensity: IntensityLevel.Moderate },
    { type: WorkoutType.Interval, name: 'Interval Training', intensity: IntensityLevel.High },
    { type: WorkoutType.Rest, name: 'Rest Day', intensity: IntensityLevel.Low },
  ]

  let sessionId = 1
  for (let week = 0; week < weeks; week++) {
    // 4 training days per week + 3 rest days
    const weekSchedule = [
      { day: 0, workout: workoutTypes[4] }, // Sunday - Rest
      { day: 1, workout: workoutTypes[0] }, // Monday - Easy
      { day: 2, workout: workoutTypes[2] }, // Tuesday - Tempo
      { day: 3, workout: workoutTypes[4] }, // Wednesday - Rest
      { day: 4, workout: workoutTypes[3] }, // Thursday - Intervals
      { day: 5, workout: workoutTypes[4] }, // Friday - Rest
      { day: 6, workout: workoutTypes[1] }, // Saturday - Long
    ]

    for (const schedule of weekSchedule) {
      const sessionDate = new Date(startDate)
      sessionDate.setDate(startDate.getDate() + week * 7 + schedule.day)

      const stage = week < 4 ? TrainingStage.Base :
                    week < 10 ? TrainingStage.Build :
                    week < 14 ? TrainingStage.Peak : TrainingStage.Taper

      // Mark past sessions as completed (first 2 weeks + some of current week)
      const now = new Date()
      const isPast = sessionDate < now
      const isCompleted = isPast && schedule.workout.type !== WorkoutType.Rest

      sessions.push({
        id: `session-${sessionId++}`,
        sessionName: schedule.workout.name,
        scheduledDate: sessionDate.toISOString(),
        workoutType: schedule.workout.type,
        durationMinutes: schedule.workout.type === WorkoutType.Rest ? undefined :
                         schedule.workout.type === WorkoutType.Long ? 90 :
                         schedule.workout.type === WorkoutType.Interval ? 45 : 30,
        distance: schedule.workout.type === WorkoutType.Rest ? undefined :
                  schedule.workout.type === WorkoutType.Long ? 16 :
                  schedule.workout.type === WorkoutType.Interval ? 8 : 5,
        intensityLevel: schedule.workout.intensity,
        cyclePhase: CyclePhase.Follicular,
        trainingStage: stage,
        isSkipped: false,
        completedAt: isCompleted ? sessionDate.toISOString() : undefined,
      })
    }
  }
  return sessions
}

const createMockPlan = (): PlanDetailResponse => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 14) // Started 2 weeks ago

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 16 * 7) // 16 week plan

  return {
    id: 'plan-1',
    raceId: 'race-1',
    raceName: 'Ogden Marathon',
    raceDate: endDate.toISOString(),
    runnerId: 'runner-1',
    planName: 'Marathon Training Plan',
    status: PlanStatus.Active,
    generationSource: 1,
    aiModel: 'gemini-pro',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    trainingDaysPerWeek: 4,
    longRunDay: 6,
    daysBeforePeriodToReduceIntensity: 2,
    daysAfterPeriodToReduceIntensity: 2,
    createdAt: startDate.toISOString(),
    sessions: generateMockSessions(startDate, 16),
  }
}

const createMockCyclePosition = (): CyclePositionDto => {
  const lastPeriodStart = new Date()
  lastPeriodStart.setDate(lastPeriodStart.getDate() - 10) // 10 days ago

  return {
    currentDayInCycle: 10,
    cycleLength: 28,
    currentPhase: CyclePhase.Follicular,
    lastPeriodStart: lastPeriodStart.toISOString(),
    nextPredictedPeriod: new Date(lastPeriodStart.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    daysUntilNextPeriod: 18,
    phaseDescription: 'Follicular Phase',
    phaseGuidance: 'Energy levels are rising. Great time for harder workouts!',
  }
}

const createMockPlanSummary = (): PlanSummaryDto => {
  const raceDate = new Date()
  raceDate.setDate(raceDate.getDate() + 98) // ~14 weeks out

  return {
    planId: 'plan-1',
    planName: 'Marathon Training Plan',
    raceName: 'Ogden Marathon',
    raceDate: raceDate.toISOString(),
    daysUntilRace: 98,
    hasPendingRecalculation: false,
    pendingConfirmation: false,
  }
}

// Mock cycle phase tips
const mockCyclePhaseTips: Record<CyclePhase, { phase: string; nutritionTips: string[]; restTips: string[]; injuryPreventionTips: string[]; moodInsights: string[] }> = {
  [CyclePhase.Menstrual]: {
    phase: 'Menstrual',
    nutritionTips: ['Increase iron-rich foods', 'Stay hydrated'],
    restTips: ['Prioritize sleep', 'Gentle movement is okay'],
    injuryPreventionTips: ['Reduce intensity if needed'],
    moodInsights: ['Energy may be lower - listen to your body']
  },
  [CyclePhase.Follicular]: {
    phase: 'Follicular',
    nutritionTips: ['Complex carbs for energy', 'Lean proteins'],
    restTips: ['Great time for challenging workouts'],
    injuryPreventionTips: ['Warm up thoroughly'],
    moodInsights: ['Energy rising - great for hard efforts!']
  },
  [CyclePhase.Ovulatory]: {
    phase: 'Ovulatory',
    nutritionTips: ['Maintain balanced nutrition', 'Antioxidant-rich foods'],
    restTips: ['Peak performance window'],
    injuryPreventionTips: ['Be mindful of joint laxity'],
    moodInsights: ['Peak energy and confidence']
  },
  [CyclePhase.Luteal]: {
    phase: 'Luteal',
    nutritionTips: ['Magnesium-rich foods', 'Reduce sodium if bloated'],
    restTips: ['May need extra recovery time'],
    injuryPreventionTips: ['Steady-state cardio preferred'],
    moodInsights: ['PMS symptoms may affect motivation']
  }
}

// Create detailed session from summary
const createDetailedSession = (summary: SessionSummary, cyclePhase?: CyclePhase): SessionDetailDto => {
  if (summary.workoutType === WorkoutType.Rest) {
    return {
      ...summary,
      cyclePhase,
      isCompleted: false,
      isSkipped: false,
    }
  }

  return {
    ...summary,
    cyclePhase,
    warmUp: '5 minute easy jog, dynamic stretches (leg swings, arm circles, high knees)',
    recovery: '5 minute cool down walk, static stretches for major muscle groups',
    sessionDescription: summary.workoutType === WorkoutType.Tempo
      ? 'Run at a comfortably hard pace - you should be able to speak in short sentences.'
      : summary.workoutType === WorkoutType.Interval
        ? 'Alternate between hard efforts and recovery. Push during intervals, recover fully between.'
        : summary.workoutType === WorkoutType.Long
          ? 'Focus on time on feet. Keep the pace easy and conversational.'
          : 'Easy conversational pace. Focus on recovery and building aerobic base.',
    workoutTips: [
      'Stay hydrated before, during, and after',
      'Listen to your body and adjust as needed',
      'Focus on good running form'
    ],
    isCompleted: false,
    isSkipped: false,
  }
}

// Mock Dashboard component that uses props instead of API calls
interface MockDashboardProps {
  planSummary: PlanSummaryDto | null
  plan: PlanDetailResponse | null
  cyclePosition: CyclePositionDto | null
  distanceUnit: 'km' | 'mi'
  isLoading?: boolean
  error?: string | null
  showRecalculationBanner?: boolean
  runnerName?: string
  goalTime?: string
}

function MockDashboard({
  planSummary,
  plan,
  cyclePosition,
  distanceUnit,
  isLoading = false,
  error = null,
  showRecalculationBanner = false,
  runnerName = 'Sarah',
  goalTime = '4:30:00',
}: MockDashboardProps) {
  const [activeView, setActiveView] = useState<CalendarView>('week')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
  const [selectedSessionMonth, setSelectedSessionMonth] = useState<string | null>(null)
  const selectedSessionRef = useRef<HTMLDivElement>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))

  // Live countdown state
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null)

  // Update countdown every minute
  useEffect(() => {
    if (!plan?.raceDate) return

    const calculateCountdown = () => {
      const now = new Date()
      const raceDate = new Date(plan.raceDate)
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
    const interval = setInterval(calculateCountdown, 60000)

    return () => clearInterval(interval)
  }, [plan?.raceDate])

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

  const handleDayClick = useCallback((date: Date, session?: SessionSummary) => {
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

    // Clear first to force re-render
    setSelectedSession(null)

    setTimeout(() => {
      const cyclePhase = displayedCyclePhases.get(formatDateKey(date))
      const detailed = createDetailedSession(session, cyclePhase)
      setSelectedSession(detailed)

      setTimeout(() => {
        selectedSessionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 50)
    }, 10)
  }, [selectedSessionId, displayedCyclePhases])

  // Render session card for list view
  const renderSessionCard = useCallback((session: SessionSummary, date: Date) => {
    const cyclePhase = displayedCyclePhases.get(formatDateKey(date))
    const detailed = createDetailedSession(session, cyclePhase)
    const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
    return (
      <WorkoutSessionCard
        session={detailed}
        cyclePhaseTips={cyclePhaseTips}
        onSessionUpdated={() => console.log('Session updated')}
        distanceUnit={distanceUnit}
      />
    )
  }, [displayedCyclePhases, distanceUnit])

  const handleNavigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newMonth
    })
  }, [])

  const handleNavigateWeek = useCallback((direction: 'prev' | 'next') => {
    setWeekStart(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
      return newWeek
    })
  }, [])

  const handlePeriodLogged = useCallback(() => {
    console.log('Period logged (mock)')
  }, [])

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
        <Button onClick={() => console.log('Navigate to onboarding')}>
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
          <Button onClick={() => console.log('Navigate to onboarding')}>
            Create Training Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 pb-64">
      {/* Recalculation status banner */}
      {showRecalculationBanner && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="ml-2">
            <div className="font-medium mb-1">Adapting Your Training Plan</div>
            <p className="text-sm text-muted-foreground">
              We've noticed your training has been a bit different than the plan. We're building you a personalized update to better match where you are right now.
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
      <div className="w-full lg:w-[70%] mx-auto mt-[48px] border-t border-border" />

      {/* Calendar View */}
      {plan && (
        <div className="w-full lg:w-[70%] mx-auto mt-[48px]">
          {/* Header row: Title + Date Navigation + View Controls */}
          <div className="flex items-center justify-between mb-[48px]">
            {/* Title */}
            <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
              {runnerName}'s {plan.raceName.includes('Marathon') ? 'Marathon' : plan.raceName.includes('Half') ? 'Half Marathon' : '10K'} Training Plan
            </h2>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
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
                onClick={() => activeView === 'week' ? handleNavigateWeek('next') : handleNavigateMonth('next')}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

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
            <div className="w-1/2 p-6 bg-card rounded-lg border border-border shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: {plan.raceName}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(plan.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Countdown section */}
                <div className="flex items-center gap-4">
                  {countdown ? (
                    <CountdownDisplay
                      days={countdown.days}
                      hours={countdown.hours}
                      minutes={countdown.minutes}
                      seconds={countdown.seconds}
                      variant="hero"
                      showSeconds
                    />
                  ) : (
                    <CountdownDisplay
                      days={planSummary?.daysUntilRace || Math.ceil((new Date(plan.raceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      hours={0}
                      minutes={0}
                      variant="hero"
                    />
                  )}
                  <span className="text-sm text-[#696863] font-normal">until race day</span>
                </div>

                {/* Goal section */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Goal className="w-5 h-5 text-[#696863]" />
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold">{goalTime}</span>
                      <span className="text-sm text-[#696863] font-normal">8:01/mi pace</span>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="cursor-pointer">
                        <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
                          <Check className="w-4 h-4" />
                          <span className="underline">On track</span>
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="end">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-success" />
                          <span className="font-medium">You're on track!</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Based on your training consistency and session completion, you're well-positioned to hit your goal.
                        </p>
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sessions completed</span>
                            <span className="font-medium">18/21 (86%)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg. effort (RPE)</span>
                            <span className="font-medium">6.2/10</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Weekly consistency</span>
                            <span className="font-medium text-success">Excellent</span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Week Summary Container */}
            {weekSummary && (
              <div className="w-1/2 p-6 bg-card rounded-lg border border-border shadow-sm">
                <div className="space-y-4">
                  <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training Summary</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#696863] font-normal">Week {weekSummary.weekNumber} of {weekSummary.totalWeeksInPlan}</span>
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
                        className="absolute bg-foreground rounded-full"
                        style={{ left: `${position}%`, top: '-4px', height: 'calc(100% + 8px)', width: '1px', transform: 'translateX(-50%)' }}
                      />
                    ))}
                  </div>

                  {/* Stage labels */}
                  <div className="flex">
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
                            <PopoverContent className="w-80 bg-[#fcf9f3] border-[#ebe8e2] p-4" align="center">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-petrona text-lg font-normal text-foreground">{stageInfo.name}</h4>
                                  <p className="text-sm font-normal text-[#696863] mt-0.5">{stageInfo.tagline}</p>
                                </div>
                                <div className="space-y-2.5">
                                  <div className="flex gap-2">
                                    <Target className="w-4 h-4 text-[#696863] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-normal text-[#696863] leading-relaxed">{stageInfo.focus}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Eye className="w-4 h-4 text-[#696863] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-normal text-[#696863] leading-relaxed">{stageInfo.whatToExpect}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Lightbulb className="w-4 h-4 text-[#696863] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-normal text-[#696863] leading-relaxed">{stageInfo.tip}</p>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )
                    })}
                  </div>

                  {/* Punch card and mileage */}
                  <div className="flex items-center justify-start text-sm text-[#696863] font-normal pt-4 border-t border-border">
                    <div className="flex items-center gap-2 shrink-0">
                      <PunchCard days={punchCardDays} />
                      <span>{punchCardDays.filter(d => d.isCompleted).length}/{punchCardDays.length} sessions</span>
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
                  onDayClick={handleDayClick}
                  isExpanded={false}
                  onToggleExpand={() => setActiveView('month')}
                  activeView={activeView}
                  onViewChange={setActiveView}
                  selectedSessionId={selectedSessionId ?? undefined}
                  displayMode={displayMode}
                  onDisplayModeChange={setDisplayMode}
                  renderSessionCard={renderSessionCard}
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
                          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
                            <WorkoutSessionCard
                              session={selectedSession}
                              onSessionUpdated={() => {
                                console.log('Session updated (mock)')
                                setSelectedSession(null)
                                setSelectedSessionId(null)
                                setSelectedSessionMonth(null)
                              }}
                              distanceUnit={distanceUnit}
                              pendingConfirmation={planSummary?.pendingConfirmation}
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
                <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
                  <WorkoutSessionCard
                    session={selectedSession}
                    onSessionUpdated={() => {
                      console.log('Session updated (mock)')
                      setSelectedSession(null)
                      setSelectedSessionId(null)
                    }}
                    distanceUnit={distanceUnit}
                    pendingConfirmation={planSummary?.pendingConfirmation}
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
                const cyclePhase = displayedCyclePhases.get(formatDateKey(sessionDate))
                const detailed = createDetailedSession(session, cyclePhase)

                return (
                  <div key={session.id}>
                    {/* Month label */}
                    {isNewMonth && (
                      <div className="w-full lg:w-2/3 mx-auto mb-4">
                        {index > 0 && <div className="border-t border-border mb-6 mt-6" />}
                        <h3 className="text-xl font-normal font-[family-name:'Petrona']">
                          {sessionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                      </div>
                    )}
                    <div className="w-full lg:w-2/3 mx-auto">
                      <WorkoutSessionCard
                        session={detailed}
                        onSessionUpdated={() => {
                          console.log('Session updated (mock)')
                        }}
                        distanceUnit={distanceUnit}
                        pendingConfirmation={planSummary?.pendingConfirmation}
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
    </div>
  )
}

// Storybook meta
const meta = {
  title: 'Pages/Dashboard',
  component: MockDashboard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <ToastProvider>
          <div className="w-full p-4">
            <Story />
          </div>
        </ToastProvider>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof MockDashboard>

export default meta
type Story = StoryObj<typeof meta>

// Stories
export const Default: Story = {
  args: {
    planSummary: createMockPlanSummary(),
    plan: createMockPlan(),
    cyclePosition: createMockCyclePosition(),
    distanceUnit: 'mi',
    runnerName: 'Sarah',
    goalTime: '4:30:00',
  },
}

export const Loading: Story = {
  args: {
    planSummary: null,
    plan: null,
    cyclePosition: null,
    distanceUnit: 'mi',
    isLoading: true,
  },
}

export const NoPlan: Story = {
  args: {
    planSummary: null,
    plan: null,
    cyclePosition: null,
    distanceUnit: 'mi',
  },
}

export const WithRecalculationBanner: Story = {
  args: {
    planSummary: createMockPlanSummary(),
    plan: createMockPlan(),
    cyclePosition: createMockCyclePosition(),
    distanceUnit: 'mi',
    showRecalculationBanner: true,
  },
}

export const NoCycleTracking: Story = {
  args: {
    planSummary: createMockPlanSummary(),
    plan: createMockPlan(),
    cyclePosition: null,
    distanceUnit: 'mi',
  },
}

export const KilometerUnits: Story = {
  args: {
    planSummary: createMockPlanSummary(),
    plan: createMockPlan(),
    cyclePosition: createMockCyclePosition(),
    distanceUnit: 'km',
  },
}

export const ErrorState: Story = {
  args: {
    planSummary: null,
    plan: null,
    cyclePosition: null,
    distanceUnit: 'mi',
    error: 'No active training plan found. Please create a race goal to generate a plan.',
  },
}
