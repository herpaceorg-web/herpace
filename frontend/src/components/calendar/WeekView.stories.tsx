import type { Meta, StoryObj } from '@storybook/react-vite'
import { WeekView, DisplayMode, CalendarView } from './WeekView'
import { WorkoutSessionCard } from '@/components/session/WorkoutSessionCard'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { CalendarDays, CalendarMinus2, Goal, Check, AlertCircle, XCircle, LayoutGrid, List } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SessionSummary, SessionDetailDto, WorkoutType, IntensityLevel, CyclePhase, TrainingStage, CyclePhaseTipsDto } from '@/types/api'
import { useState, useRef } from 'react'
import { ToastProvider } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import { formatDateKey } from '@/utils/cyclePhases'

const meta = {
  title: 'Dashboard/WeekView',
  component: WeekView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof WeekView>

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockSessions: SessionSummary[] = [
  {
    id: 'rest-1',
    sessionName: 'Rest Day',
    scheduledDate: new Date(2026, 1, 1).toISOString(),
    workoutType: WorkoutType.Rest,
    durationMinutes: 0,
    distance: 0,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: '1',
    sessionName: 'Easy Recovery Run',
    scheduledDate: new Date(2026, 1, 2).toISOString(),
    workoutType: WorkoutType.Easy,
    durationMinutes: 30,
    distance: 3,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: '2',
    sessionName: 'Tempo Run',
    scheduledDate: new Date(2026, 1, 3).toISOString(),
    workoutType: WorkoutType.Tempo,
    durationMinutes: 45,
    distance: 5,
    intensityLevel: IntensityLevel.Moderate,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: 'rest-2',
    sessionName: 'Rest Day',
    scheduledDate: new Date(2026, 1, 4).toISOString(),
    workoutType: WorkoutType.Rest,
    durationMinutes: 0,
    distance: 0,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: 'rest-3',
    sessionName: 'Rest Day',
    scheduledDate: new Date(2026, 1, 5).toISOString(),
    workoutType: WorkoutType.Rest,
    durationMinutes: 0,
    distance: 0,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: 'rest-4',
    sessionName: 'Rest Day',
    scheduledDate: new Date(2026, 1, 6).toISOString(),
    workoutType: WorkoutType.Rest,
    durationMinutes: 0,
    distance: 0,
    intensityLevel: IntensityLevel.Low,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
  {
    id: '3',
    sessionName: 'Long Run',
    scheduledDate: new Date(2026, 1, 7).toISOString(),
    workoutType: WorkoutType.Long,
    durationMinutes: 90,
    distance: 10,
    intensityLevel: IntensityLevel.High,
    trainingStage: TrainingStage.Base,
    isSkipped: false
  },
]

// Create detailed session data from summary
const createDetailedSession = (summary: SessionSummary, cyclePhase?: CyclePhase, menstruationDay?: number): SessionDetailDto => {
  // Handle rest days differently
  if (summary.workoutType === WorkoutType.Rest) {
    return {
      ...summary,
      cyclePhase,
      menstruationDay,
      warmUp: undefined,
      recovery: undefined,
      sessionDescription: 'Today is a rest day. Rest days are essential for recovery and adaptation. Your body repairs muscle tissue, replenishes energy stores, and adapts to your training during rest.',
      workoutTips: [
        'Stay active with light activities like walking or gentle stretching',
        'Focus on hydration and nutrition to support recovery',
        'Get quality sleep to maximize adaptation',
        'Use this time for foam rolling or self-massage if needed'
      ],
      phaseGuidance: cyclePhase ? 'Listen to your body and honor your need for rest during this phase.' : undefined,
      isCompleted: true, // Rest days are auto-completed
    }
  }

  return {
    ...summary,
    cyclePhase,
    menstruationDay,
    warmUp: 'Start with 5-10 minutes of easy jogging, followed by dynamic stretches (leg swings, arm circles)',
    recovery: 'Cool down with 5 minutes of walking and static stretches. Focus on hamstrings, quads, and calves',
    sessionDescription: `A ${summary.sessionName.toLowerCase()} designed to ${
      summary.workoutType === WorkoutType.Easy ? 'build aerobic base and aid recovery' :
      summary.workoutType === WorkoutType.Tempo ? 'improve lactate threshold and race pace' :
      summary.workoutType === WorkoutType.Long ? 'build endurance for race day' :
      'improve speed and VO2 max'
    }.`,
    workoutTips: [
      'Stay hydrated throughout the run',
      'Listen to your body and adjust pace as needed',
      summary.workoutType === WorkoutType.Long ? 'Consider bringing water or planning a route with water fountains' : 'Focus on maintaining consistent effort'
    ],
    phaseGuidance: cyclePhase ? 'Your energy levels may vary during this phase - adjust intensity as needed.' : undefined,
    isCompleted: false,
  }
}

const weekStart = new Date(2026, 1, 1) // Feb 1, 2026 (Sunday)
const planStartDate = new Date(2026, 1, 1) // Feb 1, 2026
const planEndDate = new Date(2026, 4, 21) // May 21, 2026
const mockRaceDate = new Date(2026, 3, 15) // April 15, 2026
const mockRaceName = 'Spring Half Marathon'
const mockRunnerName = 'Laurel'
const mockDistanceType = 'Half Marathon'
const mockGoalTime = '2:00:00'
const mockGoalDescription = 'Run the entire race without walking'

const mockCyclePhases = new Map<string, CyclePhase>([
  ['2026-02-01', CyclePhase.Menstrual],
  ['2026-02-02', CyclePhase.Menstrual],
  ['2026-02-03', CyclePhase.Menstrual],
  ['2026-02-04', CyclePhase.Menstrual],
  ['2026-02-05', CyclePhase.Follicular],
  ['2026-02-06', CyclePhase.Follicular],
  ['2026-02-07', CyclePhase.Follicular],
])

// Mock cycle phase tips for each phase
const mockCyclePhaseTips: Record<CyclePhase, CyclePhaseTipsDto> = {
  [CyclePhase.Menstrual]: {
    phase: 'Menstrual',
    nutritionTips: [
      'Increase iron-rich foods like leafy greens, legumes, and lean red meat to replenish iron lost during menstruation',
      'Stay well hydrated and consider warm, comforting foods'
    ],
    restTips: [
      'Prioritize sleep and allow for extra rest if needed',
      'Listen to your body - it\'s okay to take it easy'
    ],
    injuryPreventionTips: [
      'Warm up thoroughly as muscles may feel tighter',
      'Consider gentler stretching routines'
    ],
    moodInsights: [
      'Energy levels may be lower - be patient with yourself',
      'Light movement can actually help reduce cramps'
    ]
  },
  [CyclePhase.Follicular]: {
    phase: 'Follicular',
    nutritionTips: [
      'Focus on lean proteins and complex carbs to fuel increasing energy',
      'Great time for trying new healthy recipes'
    ],
    restTips: [
      'Energy is building - you may need less sleep',
      'Good time for morning workouts'
    ],
    injuryPreventionTips: [
      'Rising estrogen supports collagen - good time for strength work',
      'Still maintain proper form as you increase intensity'
    ],
    moodInsights: [
      'Motivation and confidence typically increase',
      'Great time for challenging workouts and new goals'
    ]
  },
  [CyclePhase.Ovulatory]: {
    phase: 'Ovulatory',
    nutritionTips: [
      'Maintain balanced nutrition with plenty of antioxidants',
      'Light, fresh foods work well during this high-energy phase'
    ],
    restTips: [
      'Peak energy - but don\'t overdo it',
      'Recovery is still important even when you feel great'
    ],
    injuryPreventionTips: [
      'Be mindful of joint laxity due to peak estrogen',
      'Focus on controlled movements and proper form'
    ],
    moodInsights: [
      'Social energy is high - great for group runs',
      'Confidence peaks - perfect for race day or time trials'
    ]
  },
  [CyclePhase.Luteal]: {
    phase: 'Luteal',
    nutritionTips: [
      'Increase magnesium-rich foods like dark chocolate, nuts, and seeds',
      'Complex carbs can help manage cravings and mood'
    ],
    restTips: [
      'You may need more sleep - honor that need',
      'Gentle recovery practices are beneficial'
    ],
    injuryPreventionTips: [
      'Coordination may decrease - be extra careful',
      'Stick to familiar routes and workouts'
    ],
    moodInsights: [
      'PMS symptoms may affect motivation - be kind to yourself',
      'Steady-state cardio can help manage mood swings'
    ]
  }
}

export const Default: Story = {
  name: 'Default (On Track Status)',
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
    const selectedSessionRef = useRef<HTMLDivElement>(null)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    const handleDayClick = (date: Date, session?: SessionSummary) => {
      if (!session) return

      // Toggle: if clicking the same session, close it
      if (selectedSession?.id === session.id) {
        setSelectedSession(null)
        return
      }

      // Clear selected session first to force re-render
      setSelectedSession(null)

      // Set new session after brief delay
      setTimeout(() => {
        const cyclePhase = mockCyclePhases.get(formatDateKey(date))
        const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
        const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
        setSelectedSession(detailed)

        setTimeout(() => {
          selectedSessionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 50)
      }, 10)
    }

    // Render session card for list view
    const renderSessionCard = (session: SessionSummary, date: Date) => {
      const cyclePhase = mockCyclePhases.get(formatDateKey(date))
      const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
      const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
      const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
      return (
        <WorkoutSessionCard
          session={detailed}
          cyclePhaseTips={cyclePhaseTips}
          onSessionUpdated={() => console.log('Session updated')}
          distanceUnit="mi"
        />
      )
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            {/* Success variant - On track */}
            <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
              <Check className="w-4 h-4" />
              On track to reach your goal
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={mockSessions}
          weekStart={weekStart}
          cyclePhases={mockCyclePhases}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={handleDayClick}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          selectedSessionId={selectedSession?.id}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          renderSessionCard={renderSessionCard}
          showControls={false}
        />

        {/* Only show selected session card in calendar mode */}
        {displayMode === 'calendar' && selectedSession && (
          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
            <WorkoutSessionCard
              session={selectedSession}
              onSessionUpdated={() => console.log('Session updated')}
              distanceUnit="mi"
            />
          </div>
        )}
      </div>
    )
  },
}

export const WithoutCycleTracking: Story = {
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
    const selectedSessionRef = useRef<HTMLDivElement>(null)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    const handleDayClick = (date: Date, session?: SessionSummary) => {
      if (!session) return

      // Toggle: if clicking the same session, close it
      if (selectedSession?.id === session.id) {
        setSelectedSession(null)
        return
      }

      // Clear selected session first to force re-render
      setSelectedSession(null)

      // Set new session after brief delay
      setTimeout(() => {
        const cyclePhase = mockCyclePhases.get(formatDateKey(date))
        const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
        const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
        setSelectedSession(detailed)

        setTimeout(() => {
          selectedSessionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 50)
      }, 10)
    }

    // Render session card for list view
    const renderSessionCard = (session: SessionSummary, date: Date) => {
      const cyclePhase = mockCyclePhases.get(formatDateKey(date))
      const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
      const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
      const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
      return (
        <WorkoutSessionCard
          session={detailed}
          cyclePhaseTips={cyclePhaseTips}
          onSessionUpdated={() => console.log('Session updated')}
          distanceUnit="mi"
        />
      )
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            {/* Success variant - On track */}
            <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
              <Check className="w-4 h-4" />
              On track to reach your goal
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={mockSessions}
          weekStart={weekStart}
          cyclePhases={new Map()}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={handleDayClick}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          selectedSessionId={selectedSession?.id}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          renderSessionCard={renderSessionCard}
          showControls={false}
        />

        {/* Only show selected session card in calendar mode */}
        {displayMode === 'calendar' && selectedSession && (
          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
            <WorkoutSessionCard
              session={selectedSession}
              onSessionUpdated={() => console.log('Session updated')}
              distanceUnit="mi"
            />
          </div>
        )}
      </div>
    )
  },
}

export const EmptyWeek: Story = {
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            {/* Success variant - On track */}
            <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
              <Check className="w-4 h-4" />
              On track to reach your goal
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={[]}
          weekStart={weekStart}
          cyclePhases={mockCyclePhases}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={() => console.log('No session on this day')}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          showControls={false}
        />
      </div>
    )
  },
}

export const SlightlyBehind: Story = {
  name: 'Slightly Behind Status',
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
    const selectedSessionRef = useRef<HTMLDivElement>(null)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    const handleDayClick = (date: Date, session?: SessionSummary) => {
      if (!session) return

      if (selectedSession?.id === session.id) {
        setSelectedSession(null)
        return
      }

      setSelectedSession(null)

      setTimeout(() => {
        const cyclePhase = mockCyclePhases.get(formatDateKey(date))
        const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
        const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
        setSelectedSession(detailed)

        setTimeout(() => {
          selectedSessionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 50)
      }, 10)
    }

    // Render session card for list view
    const renderSessionCard = (session: SessionSummary, date: Date) => {
      const cyclePhase = mockCyclePhases.get(formatDateKey(date))
      const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
      const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
      const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
      return (
        <WorkoutSessionCard
          session={detailed}
          cyclePhaseTips={cyclePhaseTips}
          onSessionUpdated={() => console.log('Session updated')}
          distanceUnit="mi"
        />
      )
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            {/* Warning variant - Slightly behind */}
            <Badge className="rounded-md text-sm font-normal bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 gap-1">
              <AlertCircle className="w-4 h-4" />
              Slightly behind to reach your goal
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={mockSessions}
          weekStart={weekStart}
          cyclePhases={mockCyclePhases}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={handleDayClick}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          selectedSessionId={selectedSession?.id}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          renderSessionCard={renderSessionCard}
          showControls={false}
        />

        {/* Only show selected session card in calendar mode */}
        {displayMode === 'calendar' && selectedSession && (
          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
            <WorkoutSessionCard
              session={selectedSession}
              onSessionUpdated={() => console.log('Session updated')}
              distanceUnit="mi"
            />
          </div>
        )}
      </div>
    )
  },
}

export const OffTrack: Story = {
  name: 'Off Track Status',
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedSession, setSelectedSession] = useState<SessionDetailDto | null>(null)
    const selectedSessionRef = useRef<HTMLDivElement>(null)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    const handleDayClick = (date: Date, session?: SessionSummary) => {
      if (!session) return

      if (selectedSession?.id === session.id) {
        setSelectedSession(null)
        return
      }

      setSelectedSession(null)

      setTimeout(() => {
        const cyclePhase = mockCyclePhases.get(formatDateKey(date))
        const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
        const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
        setSelectedSession(detailed)

        setTimeout(() => {
          selectedSessionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 50)
      }, 10)
    }

    // Render session card for list view
    const renderSessionCard = (session: SessionSummary, date: Date) => {
      const cyclePhase = mockCyclePhases.get(formatDateKey(date))
      const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
      const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
      const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
      return (
        <WorkoutSessionCard
          session={detailed}
          cyclePhaseTips={cyclePhaseTips}
          onSessionUpdated={() => console.log('Session updated')}
          distanceUnit="mi"
        />
      )
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            {/* Destructive variant - Off track */}
            <Badge variant="destructive" className="rounded-md text-sm font-normal gap-1">
              <XCircle className="w-4 h-4" />
              May be off track
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={mockSessions}
          weekStart={weekStart}
          cyclePhases={mockCyclePhases}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={handleDayClick}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          selectedSessionId={selectedSession?.id}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          renderSessionCard={renderSessionCard}
          showControls={false}
        />

        {/* Only show selected session card in calendar mode */}
        {displayMode === 'calendar' && selectedSession && (
          <div ref={selectedSessionRef} className="mt-8 w-full lg:w-2/3 mx-auto">
            <WorkoutSessionCard
              session={selectedSession}
              onSessionUpdated={() => console.log('Session updated')}
              distanceUnit="mi"
            />
          </div>
        )}
      </div>
    )
  },
}

export const ListView: Story = {
  name: 'List View',
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [activeView, setActiveView] = useState<CalendarView>('week')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('list')

    const handleToggleView = () => {
      const newIsExpanded = !isExpanded
      setIsExpanded(newIsExpanded)
      setActiveView(newIsExpanded ? 'month' : 'week')
    }

    // Render session card for list view
    const renderSessionCard = (session: SessionSummary, date: Date) => {
      const cyclePhase = mockCyclePhases.get(formatDateKey(date))
      const menstruationDay = date.getDate() // Day of cycle (mock: cycle starts Feb 1)
      const detailed = createDetailedSession(session, cyclePhase, menstruationDay)
      const cyclePhaseTips = cyclePhase ? mockCyclePhaseTips[cyclePhase] : undefined
      return (
        <WorkoutSessionCard
          session={detailed}
          cyclePhaseTips={cyclePhaseTips}
          onSessionUpdated={() => console.log('Session updated')}
          distanceUnit="mi"
        />
      )
    }

    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header row: Title + View Controls on same line */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[32px] font-normal text-foreground font-[family-name:'Petrona']">
            {mockRunnerName}'s {mockDistanceType} Training Plan
          </h2>

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

        {/* Race info and goal rows */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{mockRaceName} on {mockRaceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />
            <span>{Math.ceil((mockRaceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days until race</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Goal className="w-4 h-4" />
            <span>Goal: {mockGoalTime} finish time</span>
            <div className="h-4 border-l border-border" style={{ width: '0px' }} />

            <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
              <Check className="w-4 h-4" />
              On track to reach your goal
            </Badge>
          </div>
        </div>

        <WeekView
          sessions={mockSessions}
          weekStart={weekStart}
          cyclePhases={mockCyclePhases}
          distanceUnit="mi"
          planStartDate={planStartDate}
          planEndDate={planEndDate}
          onDayClick={() => {}}
          isExpanded={isExpanded}
          onToggleExpand={handleToggleView}
          activeView={activeView}
          onViewChange={setActiveView}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          renderSessionCard={renderSessionCard}
          showControls={false}
        />
      </div>
    )
  },
}
