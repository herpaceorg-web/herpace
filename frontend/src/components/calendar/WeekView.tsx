import * as React from 'react'
import { SessionSummary, CyclePhase, WorkoutType, TrainingStage, IntensityLevel } from '@/types/api'
import { CalendarDay } from './CalendarDay'
import { CyclePhaseLegend } from './CyclePhaseLegend'
import { Heart, LayoutGrid, List } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { calculateWeekSummary } from '@/utils/weekUtils'
import { formatDateKey } from '@/utils/cyclePhases'
import { cn } from '@/lib/utils'

export type DisplayMode = 'calendar' | 'list'

// Helper function to get zone and RPE strings based on intensity level
const getZoneAndRPE = (intensityLevel?: IntensityLevel): { zone: string; rpe: string } => {
  switch (intensityLevel) {
    case IntensityLevel.Low:
      return { zone: 'Zone 1-2', rpe: 'RPE 2-4' }
    case IntensityLevel.Moderate:
      return { zone: 'Zone 3-4', rpe: 'RPE 5-7' }
    case IntensityLevel.High:
      return { zone: 'Zone 4-5', rpe: 'RPE 7-9' }
    default:
      return { zone: '', rpe: '' }
  }
}

export type CalendarView = 'week' | 'month' | 'plan'

export interface WeekViewProps {
  sessions: SessionSummary[]
  weekStart: Date
  cyclePhases: Map<string, CyclePhase>
  distanceUnit: 'km' | 'mi'
  planStartDate: Date
  planEndDate?: Date
  planName?: string
  onDayClick: (date: Date, session?: SessionSummary) => void
  isExpanded: boolean
  onToggleExpand: () => void
  activeView?: CalendarView
  onViewChange?: (view: CalendarView) => void
  selectedSessionId?: string
  displayMode?: DisplayMode
  onDisplayModeChange?: (mode: DisplayMode) => void
  /** Render prop for session cards in list view. Receives session summary and date. */
  renderSessionCard?: (session: SessionSummary, date: Date) => React.ReactNode
  /** Whether to show the header with controls. Set to false when controls are rendered externally (e.g., in Dashboard). Defaults to true. */
  showControls?: boolean
  /** Whether to show the week summary bar. Set to false when summary is rendered externally. Defaults to true. */
  showSummary?: boolean
}

export function WeekView({
  sessions,
  weekStart,
  cyclePhases,
  distanceUnit,
  planStartDate,
  planEndDate,
  planName,
  onDayClick,
  isExpanded: _isExpanded,
  onToggleExpand: _onToggleExpand,
  activeView = 'week',
  onViewChange,
  selectedSessionId,
  displayMode = 'calendar',
  onDisplayModeChange,
  renderSessionCard,
  showControls = true,
  showSummary = true
}: WeekViewProps) {
  // Calculate week summary
  const summary = React.useMemo(
    () => calculateWeekSummary(sessions, weekStart, planStartDate, distanceUnit, planEndDate),
    [sessions, weekStart, planStartDate, distanceUnit, planEndDate]
  )

  // Generate array of 7 days (Sun-Sat)
  const weekDays = React.useMemo(() => {
    const days: Date[] = []
    const current = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [weekStart])

  // Create map of sessions by date key
  const sessionsByDate = React.useMemo(() => {
    const map = new Map<string, SessionSummary>()
    sessions.forEach(session => {
      const dateKey = formatDateKey(new Date(session.scheduledDate))
      map.set(dateKey, session)
    })
    return map
  }, [sessions])


  return (
    <div className="space-y-8">
      {/* Page Header with title and view controls - only shown when showControls is true */}
      {showControls && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-normal text-foreground font-petrona">
            {planName || 'Training Plan'}
          </h2>

          {/* View Controls */}
          <div className="flex items-center gap-3">
            {/* Display Mode Toggle (Calendar/List) */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => onDisplayModeChange?.('calendar')}
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
                onClick={() => onDisplayModeChange?.('list')}
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
                onValueChange={(value) => onViewChange?.(value as CalendarView)}
              />
            )}
          </div>
        </div>
      )}

      {/* Week Summary Bar */}
      {showSummary && (
      <div className="w-2/3 mx-auto p-4 bg-background rounded-lg border border-border">
        {/* Segmented Progress Bar with Stages */}
        <div className="mb-3">
              {/* Week info header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">
                  Week {summary.weekNumber} of {summary.totalWeeksInPlan}
                </span>
                <span className="text-sm text-muted-foreground">
                  {summary.completionPercentage}%
                </span>
              </div>

              {/* Segmented bar */}
              <div className="relative">
                {/* Background segments */}
                <div className="flex h-2 rounded-full overflow-hidden">
                  {[
                    { stage: TrainingStage.Base, width: 25 },
                    { stage: TrainingStage.Build, width: 35 },
                    { stage: TrainingStage.Peak, width: 25 },
                    { stage: TrainingStage.Taper, width: 15 }
                  ].map((segment) => {
                    const isActive = summary.trainingStage === segment.stage

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
                    width: `${summary.completionPercentage}%`,
                    borderRadius: summary.completionPercentage >= 100 ? '9999px' : undefined
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
              <div className="flex mt-2">
                {[
                  { stage: TrainingStage.Base, label: 'Base', width: 25 },
                  { stage: TrainingStage.Build, label: 'Build', width: 35 },
                  { stage: TrainingStage.Peak, label: 'Peak', width: 25 },
                  { stage: TrainingStage.Taper, label: 'Taper', width: 15 }
                ].map((segment) => {
                  const stageWeeks = Math.round((segment.width / 100) * summary.totalWeeksInPlan)
                  const stageInfo = TRAINING_STAGES[segment.stage]

                  return (
                    <div
                      key={segment.stage}
                      className="text-center"
                      style={{ width: `${segment.width}%` }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="inline-flex flex-col items-center text-xs text-[#696863] font-normal cursor-pointer hover:text-[#3d3826] transition-colors">
                            <span className="underline decoration-[#c5c2b8]">
                              {segment.label}
                            </span>
                            <span>
                              {stageWeeks} week{stageWeeks !== 1 ? 's' : ''}
                            </span>
                          </div>
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
          </div>

        {/* Stats row: Sessions, Miles, Intensity */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {summary.totalSessions} Session{summary.totalSessions !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>{summary.totalMiles} mi</span>
          <span>•</span>
          {/* Intensity Mix */}
          <div className="flex items-center gap-3">
            {summary.intensityBreakdown.low > 0 && (
              <span className="flex items-center gap-1">
                {summary.intensityBreakdown.low}×
                <Heart className="h-3 w-3 fill-destructive text-destructive" />
              </span>
            )}
            {summary.intensityBreakdown.moderate > 0 && (
              <span className="flex items-center gap-1">
                {summary.intensityBreakdown.moderate}×
                <span className="flex">
                  <Heart className="h-3 w-3 fill-destructive text-destructive" />
                  <Heart className="h-3 w-3 fill-destructive text-destructive" />
                </span>
              </span>
            )}
            {summary.intensityBreakdown.high > 0 && (
              <span className="flex items-center gap-1">
                {summary.intensityBreakdown.high}×
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
      )}

      {/* Content Area */}
      {displayMode === 'calendar' ? (
        /* Calendar View */
        <div className="space-y-2">
          {/* Cycle Phase Legend */}
          {cyclePhases.size > 0 && (
            <div className="flex justify-center py-2">
              <CyclePhaseLegend />
            </div>
          )}

          {/* Week Grid - 7 Day Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 auto-rows-fr">
          {weekDays.map(date => {
            const dateKey = formatDateKey(date)
            const session = sessionsByDate.get(dateKey)
            const cyclePhase = cyclePhases.get(dateKey)
            const { zone, rpe } = getZoneAndRPE(session?.intensityLevel)

            // Show as rest day if there's no session or if session is explicitly marked as rest
            const isRestDay = !session || session.workoutType === WorkoutType.Rest

            return (
              <div key={dateKey} className="flex flex-col">
                {/* Day of week label */}
                <div className="text-center text-xs font-normal p-2" style={{ color: '#696863' }}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <CalendarDay
                  dayNumber={date.getDate()}
                  sessionName={session?.sessionName}
                  distance={session?.distance}
                  durationMinutes={session?.durationMinutes}
                  intensityLevel={session?.intensityLevel}
                  workoutType={session?.workoutType}
                  cyclePhase={cyclePhase}
                  zone={zone}
                  rpe={rpe}
                  isRest={isRestDay}
                  isSelected={!!session && !!selectedSessionId && session.id === selectedSessionId}
                  onClick={() => onDayClick(date, session)}
                />
              </div>
            )
          })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="w-2/3 mx-auto space-y-12">
          {weekDays.map(date => {
            const dateKey = formatDateKey(date)
            const session = sessionsByDate.get(dateKey)

            // Skip days without sessions if no renderSessionCard provided
            if (!session && !renderSessionCard) return null

            return (
              <div key={dateKey}>
                {session && renderSessionCard ? (
                  renderSessionCard(session, date)
                ) : (
                  <div className="p-4 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
                    No session
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
