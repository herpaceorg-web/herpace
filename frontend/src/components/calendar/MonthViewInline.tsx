import * as React from 'react'
import { SessionSummary, CyclePhase, WorkoutType } from '@/types/api'
import { CalendarDay } from './CalendarDay'
import { CyclePhaseLegend } from './CyclePhaseLegend'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateKey } from '@/utils/cyclePhases'

export interface MonthViewInlineProps {
  currentMonth: Date
  sessions: SessionSummary[]
  cyclePhases: Map<string, CyclePhase>
  onDayClick: (date: Date, session?: SessionSummary) => void
  onNavigateMonth: (direction: 'prev' | 'next') => void
  planStartDate: Date
  planEndDate: Date
}

export function MonthViewInline({
  currentMonth,
  sessions,
  cyclePhases,
  onDayClick,
  onNavigateMonth,
  planStartDate,
  planEndDate
}: MonthViewInlineProps) {
  // Create map of sessions by date key
  const sessionsByDate = React.useMemo(() => {
    const map = new Map<string, SessionSummary>()
    sessions.forEach(session => {
      const dateKey = formatDateKey(new Date(session.scheduledDate))
      map.set(dateKey, session)
    })
    return map
  }, [sessions])

  // Generate days for current month view
  const monthDays = React.useMemo(() => {
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
  }, [currentMonth])

  // Check if navigation buttons should be disabled
  const isPrevDisabled = React.useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) <=
      new Date(planStartDate.getFullYear(), planStartDate.getMonth(), 1)
  }, [currentMonth, planStartDate])

  const isNextDisabled = React.useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1) >=
      new Date(planEndDate.getFullYear(), planEndDate.getMonth(), 1)
  }, [currentMonth, planEndDate])

  const currentMonthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasCycleTracking = cyclePhases.size > 0

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground font-petrona">
          {currentMonthLabel}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigateMonth('prev')}
            disabled={isPrevDisabled}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigateMonth('next')}
            disabled={isNextDisabled}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Cycle Phase Legend */}
      {hasCycleTracking && (
        <div className="flex justify-center py-2">
          <CyclePhaseLegend />
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 auto-rows-fr">
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
              onClick={() => onDayClick(date, session)}
            />
          )
        })}
      </div>
    </div>
  )
}
