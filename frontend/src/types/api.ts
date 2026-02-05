// Enums (using const objects to work with erasableSyntaxOnly)
export const WorkoutType = {
  Easy: 0,
  Long: 1,
  Tempo: 2,
  Interval: 3,
  Rest: 4
} as const

export type WorkoutType = typeof WorkoutType[keyof typeof WorkoutType]

export const CyclePhase = {
  Menstrual: 0,
  Follicular: 1,
  Ovulatory: 2,
  Luteal: 3
} as const

export type CyclePhase = typeof CyclePhase[keyof typeof CyclePhase]

export const IntensityLevel = {
  Low: 0,
  Moderate: 1,
  High: 2
} as const

export type IntensityLevel = typeof IntensityLevel[keyof typeof IntensityLevel]

export const FitnessLevel = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
  Elite: 3
} as const

export type FitnessLevel = typeof FitnessLevel[keyof typeof FitnessLevel]

export const DistanceUnit = {
  Kilometers: 0,
  Miles: 1
} as const

export type DistanceUnit = typeof DistanceUnit[keyof typeof DistanceUnit]

export const CycleRegularity = {
  Regular: 0,
  Irregular: 1,
  DoNotTrack: 2
} as const

export type CycleRegularity = typeof CycleRegularity[keyof typeof CycleRegularity]

export const DistanceType = {
  FiveK: 0,
  TenK: 1,
  HalfMarathon: 2,
  Marathon: 3,
  Custom: 4
} as const

export type DistanceType = typeof DistanceType[keyof typeof DistanceType]

export const RaceCompletionStatus = {
  NotAttempted: 0,
  Completed: 1,
  DNS: 2,
  DNF: 3
} as const

export type RaceCompletionStatus = typeof RaceCompletionStatus[keyof typeof RaceCompletionStatus]

export const PlanStatus = {
  Active: 0,
  Paused: 1,
  Archived: 2,
  Completed: 3
} as const

export type PlanStatus = typeof PlanStatus[keyof typeof PlanStatus]

// Auth DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
}

export interface AuthResponse {
  userId: string
  email: string
  token: string
  expiresAt: string
}

// Cycle Phase Tips DTO
export interface CyclePhaseTipsDto {
  phase: string
  nutritionTips: string[]
  restTips: string[]
  injuryPreventionTips: string[]
  moodInsights: string[]
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
  cyclePhaseTips?: CyclePhaseTipsDto
}

export interface SessionDetailDto {
  id: string
  sessionName: string
  scheduledDate: string
  workoutType: WorkoutType
  warmUp?: string
  recovery?: string
  distance?: number
  durationMinutes?: number
  intensityLevel: IntensityLevel
  cyclePhase?: CyclePhase
  phaseGuidance?: string
  sessionDescription?: string
  sessionNumberInPhase?: number
  totalSessionsInPhase?: number
  menstruationDay?: number
  workoutTips?: string[]
  isCompleted: boolean
  isSkipped: boolean
  actualDistance?: number
  actualDuration?: number
  rpe?: number
  userNotes?: string
}

export interface UpcomingSessionsResponse {
  sessions: SessionDetailDto[]
  hasPendingRecalculation: boolean
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

// Session completion DTOs
export interface CompleteSessionRequest {
  actualDistance?: number
  actualDuration?: number
  rpe?: number
  userNotes?: string
}

export interface SkipSessionRequest {
  skipReason?: string
}

export interface SessionCompletionResponse {
  sessionId: string
  success: boolean
  recalculationTriggered: boolean
  message?: string
}

// Profile DTOs
export interface CreateProfileRequest {
  name: string
  fitnessLevel: number
  distanceUnit: number
  dateOfBirth?: string
  typicalWeeklyMileage?: number
  cycleRegularity: number
  cycleLength?: number
  lastPeriodStart?: string
  lastPeriodEnd?: string
  fiveKPR?: string // TimeSpan format (HH:MM:SS)
  tenKPR?: string
  halfMarathonPR?: string
  marathonPR?: string
}

export interface ProfileResponse {
  id: string
  userId: string
  name: string
  fitnessLevel: number
  distanceUnit: number
  dateOfBirth?: string
  typicalWeeklyMileage?: number
  typicalCycleRegularity: number
  cycleLength?: number
  lastPeriodStart?: string
  lastPeriodEnd?: string
  fiveKPR?: string
  tenKPR?: string
  halfMarathonPR?: string
  marathonPR?: string
  createdAt: string
}

export type UpdateProfileRequest = CreateProfileRequest

// Race DTOs
export interface CreateRaceRequest {
  raceName: string
  raceDate: string
  trainingStartDate?: string
  distance: number
  distanceType: number
  location?: string
  goalTime?: string
  raceCompletionGoal?: string
  isPublic: boolean
}

export interface RaceResponse {
  id: string
  runnerId: string
  raceName: string
  raceDate: string
  trainingStartDate?: string
  distance: number
  distanceType: number
  location?: string
  goalTime?: string
  raceCompletionGoal?: string
  completionStatus: RaceCompletionStatus
  raceResult?: string  // TimeSpan format
  resultLoggedAt?: string
  isPublic: boolean
  hasTrainingPlan: boolean
}

export interface RaceWithStatsResponse {
  id: string
  runnerId: string
  raceName: string
  raceDate: string
  trainingStartDate?: string
  distance: number
  distanceType: number
  location?: string
  goalTime?: string
  completionStatus: RaceCompletionStatus
  raceResult?: string  // TimeSpan format
  resultLoggedAt?: string
  hasTrainingPlan: boolean
  sessionCount?: number
  planStatus?: PlanStatus
  createdAt: string
}

export interface LogRaceResultRequest {
  completionStatus: RaceCompletionStatus
  finishTime?: string  // TimeSpan format: "HH:mm:ss"
}

export interface LogRaceResultResponse {
  raceId: string
  completionStatus: RaceCompletionStatus
  finishTime?: string
  loggedAt: string
  planArchived: boolean
  message: string
}

// Plan DTOs
export interface GeneratePlanRequest {
  raceId: string
}

export interface PlanResponse {
  id: string
  raceId: string
  planName: string
  startDate: string
  endDate: string
}

export interface SessionSummary {
  id: string
  sessionName: string
  scheduledDate: string
  workoutType: WorkoutType
  durationMinutes?: number
  distance?: number
  intensityLevel: IntensityLevel
  cyclePhase?: CyclePhase
  phaseGuidance?: string
  completedAt?: string
  isSkipped: boolean
}

export interface PlanDetailResponse {
  id: string
  raceId: string
  raceName: string
  raceDate: string
  runnerId: string
  planName: string
  status: number
  generationSource: number
  aiModel?: string
  aiRationale?: string
  startDate: string
  endDate: string
  trainingDaysPerWeek: number
  longRunDay: number
  daysBeforePeriodToReduceIntensity: number
  daysAfterPeriodToReduceIntensity: number
  planCompletionGoal?: string
  createdAt: string
  sessions: SessionSummary[]
}
