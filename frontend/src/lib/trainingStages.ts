import { TrainingStage } from '@/types/api'
import type { TrainingStageInfoDto } from '@/types/api'

/**
 * Client-side mirror of the backend TrainingStageLibrary.
 * Used in contexts where only SessionSummary (no full stage info) is available,
 * e.g. the Calendar view.
 */
export const TRAINING_STAGES: Record<TrainingStage, TrainingStageInfoDto> = {
  [TrainingStage.Base]: {
    name: 'Base',
    tagline: 'Building Your Foundation',
    description:
      'This is where endurance begins. Your body is adapting to consistent training — ' +
      'building mitochondria, strengthening connective tissue, and establishing aerobic efficiency.',
    focus: 'Consistent easy-pace running, building weekly mileage gradually (no more than 10% per week).',
    whatToExpect: 'Volume increases slowly. Most runs feel comfortable and conversational.',
    tip: "Don't skip easy days to do harder ones. Consistency here is what everything else is built on.",
  },
  [TrainingStage.Build]: {
    name: 'Build',
    tagline: 'Raising the Bar',
    description:
      'Your aerobic base is solid — now it\'s time to sharpen race-specific fitness. ' +
      'Tempo runs and intervals appear more frequently to push your lactate threshold and VO2 max.',
    focus: 'Introducing quality workouts alongside your endurance base. Long runs get longer.',
    whatToExpect: 'You\'ll feel the workouts more. Recovery between hard days becomes important.',
    tip: 'Nail your easy days between hard sessions. Fuel properly — your glycogen needs go up.',
  },
  [TrainingStage.Peak]: {
    name: 'Peak',
    tagline: 'Race-Ready Power',
    description:
      'This is your highest-volume, highest-intensity phase. Your body is performing close to ' +
      'race-day conditions. These weeks simulate the demands of your goal race.',
    focus: 'Race-pace work, long runs at goal effort, back-to-back quality sessions.',
    whatToExpect:
      'This is the hardest stretch. Fatigue is normal — your body is building the fitness it needs on race day.',
    tip: 'Trust the plan. Sleep and nutrition are just as important as the workouts themselves.',
  },
  [TrainingStage.Taper]: {
    name: 'Taper',
    tagline: 'Sharpening for Race Day',
    description:
      'Volume drops intentionally — 30–50% less running. This isn\'t slacking off; ' +
      "it's when your body consolidates all that training into peak performance.",
    focus: 'Reduced volume, maintained intensity on key sessions, mental preparation for race day.',
    whatToExpect: 'Legs may feel heavy or restless. This is normal — your body is recovering and getting faster.',
    tip: 'Resist the urge to do more. Stay active but light. Focus on sleep, hydration, and race-day logistics.',
  },
}
