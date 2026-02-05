import * as z from 'zod'

export const profileStepSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),

  fitnessLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Elite'], {
    message: 'Please select your fitness level'
  }),

  distanceUnit: z.enum(['Kilometers', 'Miles'], {
    message: 'Please select your preferred distance unit'
  }),

  dateOfBirth: z.date().optional(),

  typicalWeeklyMileage: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined
      return typeof value === 'number' && Number.isNaN(value) ? undefined : value
    },
    z.number().min(0).max(200).optional()
  ),

  cycleRegularity: z.enum(['Regular', 'Irregular', 'DoNotTrack']).optional(),

  cycleLength: z.number().min(21).max(45).optional(),

  lastPeriodStart: z.date().optional(),
  lastPeriodEnd: z.date().optional(),

  // PRs as time strings (HH:MM:SS format) or empty
  fiveKPR: z.string()
    .optional()
    .refine((val) => !val || /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(val), {
      message: 'Format: HH:MM:SS (e.g., 0:25:30)'
    }),

  tenKPR: z.string()
    .optional()
    .refine((val) => !val || /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(val), {
      message: 'Format: HH:MM:SS (e.g., 0:55:20)'
    }),

  halfMarathonPR: z.string()
    .optional()
    .refine((val) => !val || /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(val), {
      message: 'Format: HH:MM:SS (e.g., 1:45:30)'
    }),

  marathonPR: z.string()
    .optional()
    .refine((val) => !val || /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(val), {
      message: 'Format: HH:MM:SS (e.g., 3:30:00)'
    }),
})

// Export the output type (after preprocessing) instead of input type
export type ProfileFormValues = z.output<typeof profileStepSchema>

export const raceStepSchema = z.object({
  raceName: z.string()
    .min(1, 'Race name is required')
    .max(200, 'Race name must be less than 200 characters'),

  raceDate: z.date({
    message: 'Please select a race date',
  }).refine((date) => {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 7)
    return date >= minDate
  }, {
    message: 'Race must be at least 7 days in the future'
  }),

  trainingStartDate: z.date({
    message: 'Please select a training start date',
  }).refine((date) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return date >= tomorrow
  }, {
    message: 'Training must start at least tomorrow'
  }),

  distanceType: z.enum(['FiveK', 'TenK', 'HalfMarathon', 'Marathon', 'Custom'], {
    message: 'Please select a distance type'
  }),

  distance: z.number().positive().max(500),

  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),

  goalTime: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const parts = trimmed.split(':')
      if (parts.length > 3) return value
      const [rawHours, rawMinutes = '0', rawSeconds = '0'] = parts
      if (rawHours === '' || rawMinutes === '' || rawSeconds === '') return value
      const hours = Number(rawHours)
      const minutes = Number(rawMinutes)
      const seconds = Number(rawSeconds)
      if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        Number.isNaN(seconds) ||
        hours < 0 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
      ) {
        return value
      }
      const paddedMinutes = String(minutes).padStart(2, '0')
      const paddedSeconds = String(seconds).padStart(2, '0')
      return `${hours}:${paddedMinutes}:${paddedSeconds}`
    },
    z.string()
      .optional()
      .refine((val) => !val || /^(\d+):([0-5]\d):([0-5]\d)$/.test(val), {
        message: 'Format: H:MM:SS (e.g., 3:45:00)'
      })
  ),

  raceCompletionGoal: z.string()
    .max(1000, 'Goal description must be less than 1000 characters')
    .optional(),

  planLength: z.number()
    .int()
    .min(8)
    .max(24)
    .optional(),

  longRunDay: z.string()
    .optional(),
}).refine(
  (data) => {
    // Cross-field validation: trainingStartDate must be before raceDate
    if (data.trainingStartDate && data.raceDate) {
      return data.trainingStartDate < data.raceDate
    }
    return true
  },
  {
    message: 'Training start date must be before race date',
    path: ['trainingStartDate']
  }
)

// Export the output type (after preprocessing) instead of input type
export type RaceFormValues = z.output<typeof raceStepSchema>
