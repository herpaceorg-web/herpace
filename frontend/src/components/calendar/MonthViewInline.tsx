import * as React from 'react'
import { SessionSummary, CyclePhase, WorkoutType, IntensityLevel } from '@/types/api'
import { CalendarDay } from './CalendarDay'
import { CyclePhaseLegend } from './CyclePhaseLegend'
import { formatDateKey } from '@/utils/cyclePhases'

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

export interface MonthViewInlineProps {
  currentMonth: Date
  sessions: SessionSummary[]
  cyclePhases: Map<string, CyclePhase>
  onDayClick: (date: Date, session?: SessionSummary) => void
  onNavigateMonth?: (direction: 'prev' | 'next') => void
  planStartDate: Date
  planEndDate: Date
  selectedSessionId?: string
}

export function MonthViewInline({
  currentMonth,
  sessions,
  cyclePhases,
  onDayClick,
  planStartDate: _planStartDate,
  planEndDate: _planEndDate,
  selectedSessionId
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasCycleTracking = cyclePhases.size > 0

  return (
    <div className="space-y-2">
      {/* Cycle Phase Legend */}
      {hasCycleTracking && (
        <div className="flex justify-center py-2">
          <CyclePhaseLegend />
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-normal p-2"
            style={{ color: '#696863' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-3 auto-rows-fr">
        {monthDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />
          }

          const dateKey = formatDateKey(date)
          const session = sessionsByDate.get(dateKey)
          const cyclePhase = cyclePhases.get(dateKey)
          const { zone, rpe } = getZoneAndRPE(session?.intensityLevel)
          const isRestDay = !session || session.workoutType === WorkoutType.Rest

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
              zone={zone}
              rpe={rpe}
              isRest={isRestDay}
              isSelected={!!session && !!selectedSessionId && session.id === selectedSessionId}
              onClick={() => onDayClick(date, session)}
            />
          )
        })}
      </div>
    </div>
  )
}
