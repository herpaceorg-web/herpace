export interface ProfileFormData {
  name: string
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'
  distanceUnit: 'Kilometers' | 'Miles'
  dateOfBirth?: Date
  typicalWeeklyMileage?: number
  cycleRegularity: 'Regular' | 'Irregular' | 'DoNotTrack'
  cycleLength?: number
  lastPeriodStart?: Date
  fiveKPR?: number // seconds
  tenKPR?: number // seconds
  halfMarathonPR?: number // seconds
  marathonPR?: number // seconds
}

export interface RaceFormData {
  raceName: string
  raceDate: Date
  distance: number
  distanceType: 'FiveK' | 'TenK' | 'HalfMarathon' | 'Marathon' | 'Custom'
  location?: string
  goalTime?: string // HH:MM:SS format
  raceCompletionGoal?: string
}

export type OnboardingStep = 1 | 2 | 3
