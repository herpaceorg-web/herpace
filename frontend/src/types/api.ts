// Enums
export enum WorkoutType {
  Easy = 0,
  Long = 1,
  Tempo = 2,
  Interval = 3,
  Rest = 4
}

export enum CyclePhase {
  Menstrual = 0,
  Follicular = 1,
  Ovulatory = 2,
  Luteal = 3
}

export enum IntensityLevel {
  Low = 0,
  Moderate = 1,
  High = 2
}

// Auth DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  email: string
  token: string
  expiresAt: string
}

// Plan and Session DTOs
export interface PlanSummaryDto {
  planId: string
  planName: string
  raceName: string
  raceDate: string
  daysUntilRace: number
  hasPendingRecalculation: boolean
  recalculationSummary?: string
  todaysSession?: SessionDetailDto
}

export interface SessionDetailDto {
  id: string
  sessionName: string
  scheduledDate: string
  workoutType: WorkoutType
  distance?: number
  durationMinutes?: number
  intensityLevel: IntensityLevel
  cyclePhase?: CyclePhase
  sessionDescription?: string
  isCompleted: boolean
  isSkipped: boolean
  actualDistance?: number
  actualDurationMinutes?: number
  reportedRPE?: number
  completionNotes?: string
}

// Profile DTOs (for future use)
export interface RunnerProfileDto {
  userId: string
  name: string
  email: string
  dateOfBirth: string
  fitnessLevel: number
  weeklyMileage: number
  distanceUnit: string
}
