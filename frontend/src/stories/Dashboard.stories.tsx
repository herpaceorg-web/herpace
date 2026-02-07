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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { cn } from '@/lib/utils'
import { Loader2, LayoutGrid, List, Goal, Check, ChevronLeft, ChevronRight, Heart, Calendar, Timer } from 'lucide-react'
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

  const displayedCyclePhases = useMemo(() => {
    if (!cyclePosition) return new Map<string, CyclePhase>()

    let rangeStart: Date, rangeEnd: Date
    if (activeView === 'month') {
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
  }, [cyclePosition, weekStart, activeView, currentMonth])

  const handleDayClick = useCallback((_date: Date, session?: SessionSummary) => {
    if (session && selectedSessionId === session.id) {
      setSelectedSessionId(null)
      setSelectedSession(null)
      return
    }

    if (!session) {
      setSelectedSessionId(null)
      setSelectedSession(null)
      return
    }

    setSelectedSessionId(session.id)

    // Clear first to force re-render
    setSelectedSession(null)

    setTimeout(() => {
      const cyclePhase = displayedCyclePhases.get(formatDateKey(_date))
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

      {/* Calendar View */}
      {plan && (
        <div className="w-full lg:w-[70%] mx-auto">
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

              {/* Week/Month/Plan Toggle - only show in calendar mode */}
              {displayMode === 'calendar' && (
                <SegmentedControl
                  options={[
                    { value: 'week', label: 'Week' },
                    { value: 'month', label: 'Month' },
                    { value: 'plan', label: 'Plan' }
                  ]}
                  value={activeView}
                  onValueChange={(value) => setActiveView(value as CalendarView)}
                />
              )}
            </div>
          </div>

          {/* Race/Goal and Summary Containers - Side by Side */}
          <div className="flex gap-4 mb-[48px]">
            {/* Race and Goal Container */}
            <div className="w-1/2 p-4 bg-background rounded-lg border border-border">
              <div className="space-y-4">
                <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: {plan.raceName}</h3>
                <div className="flex items-center gap-4 text-sm text-[#696863] font-normal">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(plan.raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="h-4 border-l border-border" />
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>
                      {countdown
                        ? `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m until race day`
                        : `${planSummary?.daysUntilRace || Math.ceil((new Date(plan.raceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race day`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
                    <Goal className="w-4 h-4" />
                    <span>Goal: {goalTime}</span>
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
              <div className="w-1/2 p-4 bg-background rounded-lg border border-border">
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

                  <div className="flex items-center gap-4 text-sm text-[#696863] font-normal pt-4 border-t border-border">
                    <span>{weekSummary.totalSessions} Sessions</span>
                    <div className="h-4 border-l border-border" />
                    <span>{weekSummary.totalMiles} {distanceUnit}</span>
                    <div className="h-4 border-l border-border" />
                    <div className="flex items-center gap-2">
                      {weekSummary.intensityBreakdown.low > 0 && (
                        <span className="flex items-center gap-1">
                          {weekSummary.intensityBreakdown.low}×
                          <Heart className="h-3 w-3 fill-destructive text-destructive" />
                        </span>
                      )}
                      {weekSummary.intensityBreakdown.moderate > 0 && (
                        <span className="flex items-center gap-1">
                          {weekSummary.intensityBreakdown.moderate}×
                          <span className="flex">
                            <Heart className="h-3 w-3 fill-destructive text-destructive" />
                            <Heart className="h-3 w-3 fill-destructive text-destructive" />
                          </span>
                        </span>
                      )}
                      {weekSummary.intensityBreakdown.high > 0 && (
                        <span className="flex items-center gap-1">
                          {weekSummary.intensityBreakdown.high}×
                          <span className="flex">
                            <Heart className="h-3 w-3 fill-destructive text-destructive" />
                            <Heart className="h-3 w-3 fill-destructive text-destructive" />
                            <Heart className="h-3 w-3 fill-destructive text-destructive" />
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-[48px]" />

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
              onNavigateMonth={handleNavigateMonth}
              planStartDate={new Date(plan.startDate)}
              planEndDate={new Date(plan.endDate)}
            />
          )}

          {/* Selected Session Details */}
          {selectedSession && (
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
