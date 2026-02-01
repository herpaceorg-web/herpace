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

  typicalWeeklyMileage: z.number().min(0).max(200).optional(),

  cycleRegularity: z.enum(['Regular', 'Irregular', 'DoNotTrack'], {
    message: 'Please indicate your cycle tracking preference'
  }),

  cycleLength: z.number().min(21).max(45).optional(),

  lastPeriodStart: z.date().optional(),

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
}).refine(
  (data) => {
    if (data.cycleRegularity !== 'DoNotTrack') {
      return data.cycleLength !== undefined && data.lastPeriodStart !== undefined
    }
    return true
  },
  {
    message: 'Cycle length and last period start are required when tracking cycle',
    path: ['cycleLength']
  }
)

export type ProfileFormValues = z.infer<typeof profileStepSchema>

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

  distanceType: z.enum(['FiveK', 'TenK', 'HalfMarathon', 'Marathon', 'Custom'], {
    message: 'Please select a distance type'
  }),

  distance: z.number().positive().max(500),

  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),

  goalTime: z.string()
    .optional()
    .refine((val) => !val || /^(\d{1,2}):([0-5]\d):([0-5]\d)$/.test(val), {
      message: 'Format: HH:MM:SS (e.g., 3:45:00)'
    }),

  raceCompletionGoal: z.string()
    .max(1000, 'Goal description must be less than 1000 characters')
    .optional(),
})

export type RaceFormValues = z.infer<typeof raceStepSchema>
