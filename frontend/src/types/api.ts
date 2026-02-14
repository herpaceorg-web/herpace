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
  DoNotTrack: 2,
  PreferNotToShare: 3
} as const

export type CycleRegularity = typeof CycleRegularity[keyof typeof CycleRegularity]

export const BirthControlType = {
  None: 0,
  Pill: 1,
  HormonalIUD: 2,
  CopperIUD: 3,
  Implant: 4,
  Shot: 5,
  Patch: 6,
  Ring: 7,
  Other: 8
} as const

export type BirthControlType = typeof BirthControlType[keyof typeof BirthControlType]

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

export const TrainingStage = {
  Base: 0,
  Build: 1,
  Peak: 2,
  Taper: 3
} as const

export type TrainingStage = typeof TrainingStage[keyof typeof TrainingStage]

export interface TrainingStageInfoDto {
  name: string
  tagline: string
  description: string
  focus: string
  whatToExpect: string
  tip: string
}

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

// Cycle tracking DTOs
export interface CyclePositionDto {
  currentDayInCycle: number
  cycleLength: number
  currentPhase: CyclePhase
  lastPeriodStart: string
  nextPredictedPeriod: string
  daysUntilNextPeriod: number
  phaseDescription: string
  phaseGuidance: string
}

export interface ReportPeriodRequest {
  periodStartDate?: string
  periodEndDate?: string
}

export interface ReportPeriodResponse {
  success: boolean
  message: string
  triggeredRegeneration: boolean
  daysDifference?: number
  updatedCyclePosition?: CyclePositionDto
}

// Plan and Session DTOs
export interface PlanSummaryDto {
  planId: string
  planName: string
  raceName: string
  raceDate: string
  daysUntilRace: number
  hasPendingRecalculation: boolean
  pendingConfirmation: boolean // NEW - user needs to confirm recalculation
  recalculationSummary?: string
  latestAdaptation?: LatestAdaptationDto
  todaysSession?: SessionDetailDto
  cyclePhaseTips?: CyclePhaseTipsDto
  recalculationPreview?: RecalculationPreviewDto // Preview of proposed changes
}

export interface RecalculationPreviewDto {
  summary: string
  sessionChanges: SessionChangeDto[]
  generatedAt: string
  sessionsAffectedCount: number
}

export interface LatestAdaptationDto {
  adaptedAt: string
  sessionChanges: SessionChangeDto[]
}

export interface SessionChangeDto {
  sessionId: string
  scheduledDate: string
  sessionName: string
  oldDistance?: number
  oldDuration?: number
  oldWorkoutType?: WorkoutType
  oldIntensityLevel?: IntensityLevel
  newDistance?: number
  newDuration?: number
  newWorkoutType: WorkoutType
  newIntensityLevel: IntensityLevel
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
  trainingStage?: TrainingStage
  trainingStageInfo?: TrainingStageInfoDto
  isCompleted: boolean
  isSkipped: boolean
  isRecentlyUpdated?: boolean
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
  recalculationTriggered: boolean // Legacy - kept for compatibility
  recalculationRequested: boolean // NEW - threshold met, recalculation needed
  pendingConfirmation: boolean // NEW - user needs to respond to confirmation modal
  message?: string
}

export interface RecalculationConfirmationResponse {
  success: boolean
  recalculationEnqueued: boolean
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
  birthControlType: number
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

// Fitness Tracker Enums
export const FitnessPlatform = {
  Strava: 'Strava',
  HealthConnect: 'HealthConnect',
  Garmin: 'Garmin'
} as const

export type FitnessPlatform = typeof FitnessPlatform[keyof typeof FitnessPlatform]

export const ConnectionStatus = {
  Connected: 'Connected',
  NotConnected: 'NotConnected',
  Disconnected: 'Disconnected',
  TokenExpired: 'TokenExpired',
  Error: 'Error'
} as const

export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus]

// Fitness Tracker DTOs
export interface ConnectedServiceDto {
  platform: string
  displayName: string
  status: string
  externalUserId?: string
  connectedAt?: string
  lastSyncAt?: string
  activitiesImported: number
  available: boolean
  womensHealthDataOptIn?: boolean
}

export interface ServicesListResponse {
  services: ConnectedServiceDto[]
}

export interface OAuthInitiateResponse {
  authorizationUrl: string
  state: string
}

export interface ImportedActivitySummaryDto {
  id: string
  platform: string
  activityDate: string
  activityTitle?: string
  activityType: string
  distanceMeters?: number
  durationSeconds?: number
  averagePaceSecondsPerKm?: number
  averageHeartRate?: number
  maxHeartRate?: number
  cadence?: number
  elevationGainMeters?: number
  caloriesBurned?: number
  hasGpsRoute: boolean
  matchedTrainingSessionId?: string
  importedAt: string
}

export interface GpsPoint {
  lat: number
  lng: number
  altitude?: number
}

export interface MatchedSessionDto {
  id: string
  sessionName: string
  scheduledDate: string
  workoutType: string
  plannedDistance?: number
  plannedDuration?: number
}

export interface ImportedActivityDetailDto {
  id: string
  platform: string
  activityDate: string
  activityTitle?: string
  activityType: string
  distanceMeters?: number
  durationSeconds?: number
  movingTimeSeconds?: number
  averagePaceSecondsPerKm?: number
  averageHeartRate?: number
  maxHeartRate?: number
  cadence?: number
  elevationGainMeters?: number
  caloriesBurned?: number
  gpsRoute?: GpsPoint[]
  matchedTrainingSession?: MatchedSessionDto
  importedAt: string
}

export interface PaginatedActivitiesResponse {
  activities: ImportedActivitySummaryDto[]
  pagination: PaginationInfo
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface DisconnectResponse {
  platform: string
  status: string
  dataDeleted: boolean
  activitiesRetained: number
}

export interface SyncResponse {
  syncId: string
  message: string
}

export interface SyncLogDto {
  id: string
  platform: string
  syncType: string
  startedAt: string
  completedAt?: string
  activitiesImported: number
  activitiesDuplicate: number
  activitiesFiltered: number
  success: boolean
  errorMessage?: string
}

export interface SyncLogListResponse {
  logs: SyncLogDto[]
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
  trainingStage?: TrainingStage
  completedAt?: string
  isSkipped: boolean
  warmUp?: string
  recovery?: string
  sessionDescription?: string
  workoutTips?: string[]
  isCompleted: boolean
  wasModified?: boolean
  actualDistance?: number
  actualDuration?: number
  rpe?: number
  userNotes?: string
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
