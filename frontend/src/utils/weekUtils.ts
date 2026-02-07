import { SessionSummary, TrainingStage, IntensityLevel } from '@/types/api'

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

/**
 * Get the week range (start and end dates) for a given date
 */
export function getWeekRange(date: Date): [Date, Date] {
  return [getWeekStart(date), getWeekEnd(date)]
}

/**
 * Calculate the training week number based on plan start date
 */
export function getWeekNumber(date: Date, planStartDate: Date): number {
  const weekStart = getWeekStart(date)
  const planWeekStart = getWeekStart(planStartDate)

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksDiff = Math.floor((weekStart.getTime() - planWeekStart.getTime()) / msPerWeek)

  return weeksDiff + 1
}

/**
 * Check if a date falls within a specific week
 */
export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  const weekEnd = getWeekEnd(weekStart)

  return d >= weekStart && d <= weekEnd
}

/**
 * Intensity breakdown counts
 */
export interface IntensityBreakdown {
  low: number
  moderate: number
  high: number
}

/**
 * Week summary statistics
 */
export interface WeekSummary {
  totalSessions: number
  completedSessions: number
  skippedSessions: number
  totalMiles: number
  completedMiles: number
  trainingStage: TrainingStage | undefined
  weekNumber: number
  totalWeeksInPlan: number
  completionPercentage: number
  intensityBreakdown: IntensityBreakdown
}

/**
 * Calculate total weeks in a plan
 */
export function getTotalWeeksInPlan(planStartDate: Date, planEndDate: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const planStart = getWeekStart(planStartDate)
  const planEnd = getWeekStart(planEndDate)
  return Math.ceil((planEnd.getTime() - planStart.getTime()) / msPerWeek) + 1
}

/**
 * Calculate week summary from sessions
 */
export function calculateWeekSummary(
  sessions: SessionSummary[],
  weekStart: Date,
  planStartDate: Date,
  distanceUnit: 'km' | 'mi',
  planEndDate?: Date
): WeekSummary {
  // Filter sessions to current week
  const weekSessions = sessions.filter(s =>
    isDateInWeek(new Date(s.scheduledDate), weekStart)
  )

  // Calculate total sessions and completion stats
  const totalSessions = weekSessions.length
  const completedSessions = weekSessions.filter(s => s.completedAt).length
  const skippedSessions = weekSessions.filter(s => s.isSkipped).length

  // Calculate total miles and completed miles
  let totalMiles = 0
  let completedMiles = 0
  weekSessions.forEach(session => {
    if (session.distance) {
      // Distance from API is in km, convert if needed
      const distanceInMiles = distanceUnit === 'km' ? session.distance * 0.621371 : session.distance
      totalMiles += distanceInMiles
      if (session.completedAt) {
        completedMiles += distanceInMiles
      }
    }
  })

  // Get training stage from first session with a stage
  const trainingStage = weekSessions.find(s => s.trainingStage !== undefined)?.trainingStage

  // Calculate week number
  const weekNumber = getWeekNumber(weekStart, planStartDate)

  // Calculate total weeks in plan
  const totalWeeksInPlan = planEndDate
    ? getTotalWeeksInPlan(planStartDate, planEndDate)
    : 16 // Default fallback

  // Calculate completion percentage
  const completionPercentage = Math.round((weekNumber / totalWeeksInPlan) * 100)

  // Calculate intensity breakdown
  const intensityBreakdown: IntensityBreakdown = {
    low: 0,
    moderate: 0,
    high: 0
  }

  weekSessions.forEach(session => {
    switch (session.intensityLevel) {
      case IntensityLevel.Low:
        intensityBreakdown.low++
        break
      case IntensityLevel.Moderate:
        intensityBreakdown.moderate++
        break
      case IntensityLevel.High:
        intensityBreakdown.high++
        break
    }
  })

  return {
    totalSessions,
    completedSessions,
    skippedSessions,
    totalMiles: Math.round(totalMiles * 10) / 10, // Round to 1 decimal
    completedMiles: Math.round(completedMiles * 10) / 10, // Round to 1 decimal
    trainingStage,
    weekNumber,
    totalWeeksInPlan,
    completionPercentage,
    intensityBreakdown
  }
}

/**
 * Get training stage display name
 */
export function getTrainingStageName(stage?: TrainingStage): string {
  if (stage === undefined) return 'Training'

  switch (stage) {
    case TrainingStage.Base:
      return 'Base'
    case TrainingStage.Build:
      return 'Build'
    case TrainingStage.Peak:
      return 'Peak'
    case TrainingStage.Taper:
      return 'Taper'
    default:
      return 'Training'
  }
}
