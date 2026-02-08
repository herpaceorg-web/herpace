import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, useEffect, useMemo } from 'react'
import { CountdownDisplay } from '@/components/ui/countdown-display'
import { Calendar, Goal, Check, TrendingUp, ChevronRight, Target, Activity, Flame, Route } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { PunchCard, PunchCardDay } from '@/components/ui/punch-card'
import { TRAINING_STAGES } from '@/lib/trainingStages'
import { TrainingStage } from '@/types/api'
import { cn } from '@/lib/utils'

const meta: Meta<typeof CountdownDisplay> = {
  title: 'Components/CountdownDisplay',
  component: CountdownDisplay,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-background">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Hero variant - large numbers with labels
export const Hero: Story = {
  args: {
    days: 42,
    hours: 12,
    minutes: 34,
    variant: 'hero',
  },
}

// Hero boxed variant - flip clock style
export const HeroBoxed: Story = {
  args: {
    days: 42,
    hours: 12,
    minutes: 34,
    variant: 'hero-boxed',
  },
}

// With seconds
export const HeroWithSeconds: Story = {
  args: {
    days: 42,
    hours: 12,
    minutes: 34,
    seconds: 56,
    variant: 'hero',
    showSeconds: true,
  },
}

export const HeroBoxedWithSeconds: Story = {
  args: {
    days: 42,
    hours: 12,
    minutes: 34,
    seconds: 56,
    variant: 'hero-boxed',
    showSeconds: true,
  },
}

// Inline variant
export const Inline: Story = {
  args: {
    days: 42,
    hours: 12,
    minutes: 34,
    variant: 'inline',
  },
}

// Live countdown demo
const LiveCountdownDemo = ({ variant }: { variant: 'hero' | 'hero-boxed' }) => {
  const [countdown, setCountdown] = useState({ days: 42, hours: 12, minutes: 34, seconds: 56 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds -= 1
        if (seconds < 0) {
          seconds = 59
          minutes -= 1
        }
        if (minutes < 0) {
          minutes = 59
          hours -= 1
        }
        if (hours < 0) {
          hours = 23
          days -= 1
        }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <CountdownDisplay
      days={countdown.days}
      hours={countdown.hours}
      minutes={countdown.minutes}
      seconds={countdown.seconds}
      variant={variant}
      showSeconds
    />
  )
}

export const LiveHero: Story = {
  render: () => <LiveCountdownDemo variant="hero" />,
}

export const LiveHeroBoxed: Story = {
  render: () => <LiveCountdownDemo variant="hero-boxed" />,
}

// In context - showing how it looks in the Training For card
const TrainingForCardDemo = ({ variant }: { variant: 'hero' | 'hero-boxed' }) => {
  const [countdown, setCountdown] = useState({ days: 42, hours: 12, minutes: 34, seconds: 56 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds -= 1
        if (seconds < 0) {
          seconds = 59
          minutes -= 1
        }
        if (minutes < 0) {
          minutes = 59
          hours -= 1
        }
        if (hours < 0) {
          hours = 23
          days -= 1
        }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-[500px] p-6 bg-background rounded-lg border border-border">
      <div className="space-y-6">
        <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: Ogden Marathon</h3>

        {/* Countdown section - date, countdown, label grouped together */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-sm text-[#696863] font-normal mb-2">
            <Calendar className="w-4 h-4" />
            <span>May 17, 2025</span>
          </div>
          <CountdownDisplay
            days={countdown.days}
            hours={countdown.hours}
            minutes={countdown.minutes}
            seconds={countdown.seconds}
            variant={variant}
            showSeconds
          />
          <p className="text-center text-sm text-[#696863] font-normal mt-2">until race day</p>
        </div>

        {/* Goal */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
            <Goal className="w-4 h-4" />
            <span>Goal: 3:30:00</span>
          </div>
          <Badge className="rounded-md text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1">
            <Check className="w-4 h-4" />
            On track
          </Badge>
        </div>
      </div>
    </div>
  )
}

export const InContextHero: Story = {
  render: () => <TrainingForCardDemo variant="hero" />,
  parameters: {
    layout: 'centered',
  },
}

export const InContextHeroBoxed: Story = {
  render: () => <TrainingForCardDemo variant="hero-boxed" />,
  parameters: {
    layout: 'centered',
  },
}

// Shared Training Summary Component
const TrainingSummary = () => {
  const weekSummary = {
    weekNumber: 6,
    totalWeeksInPlan: 16,
    completionPercentage: 38,
    trainingStage: TrainingStage.Build,
    totalMiles: 34
  }
  const lastWeekMileage = 28
  const distanceUnit = 'mi'

  const punchCardDays: PunchCardDay[] = [
    { dayNumber: 1, hasSession: true, isCompleted: true, isSkipped: false, isRest: false },
    { dayNumber: 2, hasSession: true, isCompleted: true, isSkipped: false, isRest: false },
    { dayNumber: 3, hasSession: true, isCompleted: true, isSkipped: false, isRest: false },
    { dayNumber: 4, hasSession: true, isCompleted: false, isSkipped: false, isRest: false },
  ]

  return (
    <div className="flex-1 p-6 bg-background rounded-lg border border-border">
      <div className="space-y-6">
        <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training Summary</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#696863] font-normal">Week {weekSummary.weekNumber} of {weekSummary.totalWeeksInPlan}</span>
          <span className="text-sm text-[#696863] font-normal">{weekSummary.completionPercentage}%</span>
        </div>

        {/* Segmented Progress Bar with Stages */}
        <div className="relative">
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

          <div
            className="absolute top-0 left-0 h-2 bg-primary rounded-l-full transition-all"
            style={{
              width: `${weekSummary.completionPercentage}%`,
              borderRadius: weekSummary.completionPercentage >= 100 ? '9999px' : undefined
            }}
          />

          {[25, 60, 85].map((position) => (
            <div
              key={position}
              className="absolute w-0.5 bg-foreground"
              style={{ left: `${position}%`, top: '-4px', height: 'calc(100% + 8px)' }}
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

        {/* Punch card and mileage */}
        <div className="flex items-center pt-4 border-t border-border">
          <div className="w-2/3 flex items-center justify-center gap-3 text-sm text-[#696863] font-normal">
            <PunchCard days={punchCardDays} />
            <span>{punchCardDays.filter(d => d.isCompleted).length}/{punchCardDays.length} sessions</span>
          </div>
          <div className="h-10 border-l border-border" />
          <div className="w-1/3 flex items-center justify-center gap-3">
            <Route className="w-5 h-5 text-[#696863]" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{weekSummary.totalMiles} {distanceUnit}</span>
              <span className="text-sm text-[#696863] font-normal">
                this week
                {lastWeekMileage > 0 && (
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
  )
}

// Goal Section Variations
// Option A: Inline goal with pace + clickable status
const GoalOptionA = () => {
  const [countdown, setCountdown] = useState({ days: 42, hours: 12, minutes: 34, seconds: 56 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds -= 1
        if (seconds < 0) { seconds = 59; minutes -= 1 }
        if (minutes < 0) { minutes = 59; hours -= 1 }
        if (hours < 0) { hours = 23; days -= 1 }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex gap-4 w-[1200px]">
      {/* Left: Training For card */}
      <div className="flex-1 p-6 bg-background rounded-lg border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: Ogden Marathon</h3>
            <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
              <Calendar className="w-4 h-4" />
              <span>May 17, 2025</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CountdownDisplay
              days={countdown.days}
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              variant="hero"
              showSeconds
            />
            <span className="text-sm text-[#696863] font-normal">until race day</span>
          </div>

          {/* Option A: Goal with pace breakdown + clickable status */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Goal className="w-5 h-5 text-[#696863]" />
              <div className="flex flex-col">
                <span className="text-lg font-semibold">3:30:00</span>
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

      {/* Right: Training Summary */}
      <TrainingSummary />
    </div>
  )
}

export const GoalVariantA: Story = {
  render: () => <GoalOptionA />,
  parameters: {
    layout: 'centered',
  },
}

// Option B: Goal as hero element with larger display
const GoalOptionB = () => {
  const [countdown, setCountdown] = useState({ days: 42, hours: 12, minutes: 34, seconds: 56 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds -= 1
        if (seconds < 0) { seconds = 59; minutes -= 1 }
        if (minutes < 0) { minutes = 59; hours -= 1 }
        if (hours < 0) { hours = 23; days -= 1 }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex gap-4 w-[1200px]">
      {/* Left: Training For card */}
      <div className="flex-1 p-6 bg-background rounded-lg border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: Ogden Marathon</h3>
            <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
              <Calendar className="w-4 h-4" />
              <span>May 17, 2025</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CountdownDisplay
              days={countdown.days}
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              variant="hero"
              showSeconds
            />
            <span className="text-sm text-[#696863] font-normal">until race day</span>
          </div>

          {/* Option B: Goal as prominent centered element */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Goal Time</span>
                <span className="text-3xl font-semibold tracking-tight">3:30:00</span>
                <span className="text-sm text-muted-foreground mt-1">8:01/mi pace • 15 min faster than PR</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="cursor-pointer">
                    <Badge className="rounded-full px-4 py-1 text-sm font-normal bg-success/10 text-success border-success/20 hover:bg-success/20 gap-1.5">
                      <Check className="w-4 h-4" />
                      On track to goal
                      <ChevronRight className="w-3 h-3" />
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="center">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">What "On track" means</h4>
                      <p className="text-sm text-muted-foreground">
                        You're completing sessions consistently and your effort levels align with your training plan.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-semibold">86%</div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold">6.2</div>
                        <div className="text-xs text-muted-foreground">Avg RPE</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-success">A</div>
                        <div className="text-xs text-muted-foreground">Consistency</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Keep up this effort! Your training is progressing as expected for a 3:30 finish.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Training Summary */}
      <TrainingSummary />
    </div>
  )
}

export const GoalVariantB: Story = {
  render: () => <GoalOptionB />,
  parameters: {
    layout: 'centered',
  },
}

// Option C: Goal with visual metrics row
const GoalOptionC = () => {
  const [countdown, setCountdown] = useState({ days: 42, hours: 12, minutes: 34, seconds: 56 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev
        seconds -= 1
        if (seconds < 0) { seconds = 59; minutes -= 1 }
        if (minutes < 0) { minutes = 59; hours -= 1 }
        if (hours < 0) { hours = 23; days -= 1 }
        return { days, hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex gap-4 w-[1200px]">
      {/* Left: Training For card */}
      <div className="flex-1 p-6 bg-background rounded-lg border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[24px] font-normal font-[family-name:'Petrona']">Training For: Ogden Marathon</h3>
            <div className="flex items-center gap-2 text-sm text-[#696863] font-normal">
              <Calendar className="w-4 h-4" />
              <span>May 17, 2025</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CountdownDisplay
              days={countdown.days}
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              variant="hero"
              showSeconds
            />
            <span className="text-sm text-[#696863] font-normal">until race day</span>
          </div>

          {/* Option C: Goal with metrics row */}
          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-2xl font-semibold">3:30:00</span>
                <span className="text-sm text-muted-foreground">goal</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-success" />
                <span>15 min faster than PR</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20 hover:bg-success/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-success" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-success">On track</div>
                          <div className="text-xs text-muted-foreground">86% sessions completed</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-success" />
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">You're on track for 3:30:00!</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span>Sessions completed</span>
                            <span className="font-medium">18/21</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div className="bg-success h-1.5 rounded-full" style={{ width: '86%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Flame className="w-4 h-4 text-muted-foreground" />
                        <div className="flex justify-between flex-1">
                          <span>Average effort</span>
                          <span className="font-medium">6.2 RPE</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <div className="flex justify-between flex-1">
                          <span>This week vs last</span>
                          <span className="font-medium text-success">+12% mileage</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-3 border-t">
                      Maintain your current training consistency. Your long runs are building the endurance needed for race day.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Training Summary */}
      <TrainingSummary />
    </div>
  )
}

export const GoalVariantC: Story = {
  render: () => <GoalOptionC />,
  parameters: {
    layout: 'centered',
  },
}
