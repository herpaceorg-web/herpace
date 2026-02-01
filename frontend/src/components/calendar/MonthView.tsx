import { CyclePhase } from '@/types/api'
import type { SessionSummary } from '@/types/api'
import { DayCell } from './DayCell'
import { formatDateKey } from '@/utils/cyclePhases'

interface MonthViewProps {
  year: number
  month: number // 0-11 (JavaScript Date convention)
  sessions: SessionSummary[]
  cyclePhases: Map<string, CyclePhase>
  onSessionClick?: (session: SessionSummary) => void
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ year, month, sessions, cyclePhases, onSessionClick }: MonthViewProps) {
  // Create a map of sessions by date for quick lookup
  const sessionsByDate = new Map<string, SessionSummary>()
  sessions.forEach((session) => {
    const date = new Date(session.scheduledDate)
    const dateKey = formatDateKey(date)
    sessionsByDate.set(dateKey, session)
  })

  // Get the first day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday

  // Get the last day of the month
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Calculate days from previous month to show
  const prevMonthDays: Date[] = []
  if (firstDayOfWeek > 0) {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const lastDayOfPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate()

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(prevMonthYear, prevMonth, lastDayOfPrevMonth - i))
    }
  }

  // Current month days
  const currentMonthDays: Date[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    currentMonthDays.push(new Date(year, month, day))
  }

  // Calculate days from next month to fill the grid
  const totalDaysShown = prevMonthDays.length + currentMonthDays.length
  const remainingCells = 7 - (totalDaysShown % 7)
  const nextMonthDays: Date[] = []

  if (remainingCells < 7) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year

    for (let day = 1; day <= remainingCells; day++) {
      nextMonthDays.push(new Date(nextMonthYear, nextMonth, day))
    }
  }

  // Combine all days
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

  return (
    <div className="w-full">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {allDays.map((date, index) => {
          const dateKey = formatDateKey(date)
          const session = sessionsByDate.get(dateKey)
          const cyclePhase = cyclePhases.get(dateKey)
          const isCurrentMonth = date.getMonth() === month

          return (
            <DayCell
              key={index}
              date={date}
              session={session}
              cyclePhase={cyclePhase}
              isCurrentMonth={isCurrentMonth}
              onClick={session && onSessionClick ? () => onSessionClick(session) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
