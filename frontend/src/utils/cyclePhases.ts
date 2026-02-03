import { CyclePhase } from '@/types/api'

/**
 * Get the number of days between two dates
 */
function getDaysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((end.getTime() - start.getTime()) / msPerDay)
}

/**
 * Get day in cycle (1-based, where day 1 = first period day)
 */
export function getDayInCycle(
  date: Date,
  lastPeriodStart: Date,
  cycleLength: number
): number {
  const daysSinceLastPeriod = getDaysBetween(lastPeriodStart, date)
  const dayInCycle = (daysSinceLastPeriod % cycleLength) + 1
  return dayInCycle
}

/**
 * Calculate cycle phase for a specific date
 * Mirrors backend CyclePhaseCalculator logic
 */
export function calculateCyclePhase(
  date: Date,
  lastPeriodStart: Date,
  cycleLength: number
): CyclePhase {
  const dayInCycle = getDayInCycle(date, lastPeriodStart, cycleLength)

  // Menstrual phase: Days 1-5 (fixed)
  if (dayInCycle <= 5) {
    return CyclePhase.Menstrual
  }

  // Calculate remaining days after menstrual phase
  const remainingDays = cycleLength - 5

  // Follicular: ~30% of remaining days
  const follicularDays = Math.round(remainingDays * 0.3)
  const follicularEnd = 5 + follicularDays

  if (dayInCycle <= follicularEnd) {
    return CyclePhase.Follicular
  }

  // Ovulatory: ~7% of remaining days (minimum 2 days)
  const ovulatoryDays = Math.max(2, Math.round(remainingDays * 0.07))
  const ovulatoryEnd = follicularEnd + ovulatoryDays

  if (dayInCycle <= ovulatoryEnd) {
    return CyclePhase.Ovulatory
  }

  // Luteal: Rest of the cycle (~63% of remaining days)
  return CyclePhase.Luteal
}

/**
 * Generate cycle phases for a date range
 * Returns a Map with date string keys (YYYY-MM-DD format) and CyclePhase values
 */
export function generateCyclePhasesForRange(
  startDate: Date,
  endDate: Date,
  lastPeriodStart: Date,
  cycleLength: number
): Map<string, CyclePhase> {
  const phases = new Map<string, CyclePhase>()

  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0) // Normalize to start of day

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (currentDate <= end) {
    const dateKey = formatDateKey(currentDate)
    const phase = calculateCyclePhase(currentDate, lastPeriodStart, cycleLength)
    phases.set(dateKey, phase)

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return phases
}

/**
 * Format date as YYYY-MM-DD string for use as map key
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get cycle phase name as display string
 */
export function getCyclePhaseName(phase: CyclePhase): string {
  switch (phase) {
    case CyclePhase.Menstrual:
      return 'Menstrual'
    case CyclePhase.Follicular:
      return 'Follicular'
    case CyclePhase.Ovulatory:
      return 'Ovulatory'
    case CyclePhase.Luteal:
      return 'Luteal'
    default:
      return 'Unknown'
  }
}

/**
 * Canonical phase colors shared across Calendar and HormoneCycleChart.
 * badge  = solid hex used for legend dots, badges, and opacity-derived overlays.
 * background = low-opacity tint used for calendar day cells and chart overlays.
 */
export const CYCLE_PHASE_COLORS: Record<CyclePhase, { badge: string; background: string }> = {
  [CyclePhase.Menstrual]:  { badge: '#4E6D80', background: 'rgba(78, 109, 128, 0.15)' },
  [CyclePhase.Follicular]: { badge: '#5A7E5E', background: 'rgba(90, 126, 94, 0.15)' },
  [CyclePhase.Ovulatory]:  { badge: '#D97706', background: 'rgba(217, 119, 6, 0.15)' },
  [CyclePhase.Luteal]:     { badge: '#7E6A8A', background: 'rgba(126, 106, 138, 0.15)' },
}

/**
 * Get cycle phase background color (rgba tint for cell/overlay fills)
 */
export function getCyclePhaseColor(phase: CyclePhase): string {
  return CYCLE_PHASE_COLORS[phase]?.background ?? 'rgba(0, 0, 0, 0.05)'
}

/**
 * Get cycle phase badge color (solid hex for legend dots / badges)
 */
export function getCyclePhaseBadgeColor(phase: CyclePhase): string {
  return CYCLE_PHASE_COLORS[phase]?.badge ?? '#888888'
}
