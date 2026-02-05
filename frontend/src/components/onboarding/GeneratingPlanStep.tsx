import { useEffect, useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { FormulaAnimation } from './FormulaAnimation'

// Training plan generation phases with messages
const GENERATION_PHASES = [
  {
    name: 'Profile Analysis',
    range: [0, 20],
    messages: [
      'Analyzing your runner profile...',
      'Understanding your race goals...',
      'Reviewing your training history...'
    ]
  },
  {
    name: 'Cycle Integration',
    range: [20, 40],
    messages: [
      'Syncing with your menstrual cycle phases...',
      'Identifying optimal training windows...',
      'Planning around your cycle patterns...'
    ]
  },
  {
    name: 'Workout Planning',
    range: [40, 70],
    messages: [
      'Designing weekly training structure...',
      'Creating pace-specific workouts...',
      'Planning long run progression...',
      'Structuring tempo and interval sessions...'
    ]
  },
  {
    name: 'Cycle Optimization',
    range: [70, 90],
    messages: [
      'Adjusting workouts for hormone phases...',
      'Optimizing intensity for cycle symptoms...',
      'Balancing hard training with recovery...'
    ]
  },
  {
    name: 'Taper & Finalization',
    range: [90, 100],
    messages: [
      'Designing your race taper strategy...',
      'Fine-tuning final details...',
      'Your HerPace Training Plan is Ready!'
    ]
  }
]

// Get current phase based on progress percentage
const getCurrentPhase = (progress: number) => {
  return GENERATION_PHASES.find(
    phase => progress >= phase.range[0] && progress < phase.range[1]
  ) || GENERATION_PHASES[GENERATION_PHASES.length - 1]
}

export interface GeneratingPlanStepProps {
  initialProgress?: number // For demo/testing purposes
  initialComplete?: boolean // For demo/testing purposes
  onReviewPlan?: () => void // Called when user clicks "Review Training Plan"
}

export function GeneratingPlanStep({ initialProgress = 0, initialComplete = false, onReviewPlan }: GeneratingPlanStepProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(initialProgress)
  const [currentPhase, setCurrentPhase] = useState(getCurrentPhase(initialProgress))
  const [isComplete, setIsComplete] = useState(initialComplete)

  useEffect(() => {
    // Update current phase based on progress
    const newPhase = getCurrentPhase(progress)
    if (newPhase !== currentPhase) {
      setCurrentPhase(newPhase)
      setMessageIndex(0) // Reset message index when phase changes
    }
  }, [progress, currentPhase])

  useEffect(() => {
    // Skip animation if starting in completed state
    if (initialComplete) {
      setProgress(100)
      setIsComplete(true)
      setCurrentPhase(GENERATION_PHASES[GENERATION_PHASES.length - 1])
      setMessageIndex(GENERATION_PHASES[GENERATION_PHASES.length - 1].messages.length - 1)
      return
    }

    // Rotate messages within current phase every 6 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % currentPhase.messages.length)
    }, 6000)

    // Smoothly increment progress from 0 to 100 over ~120 seconds
    // Update every 100ms for smooth animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Increment by ~0.083% each 100ms to reach 100% in 120 seconds
        const increment = 100 / (120 * 10)
        const newProgress = prev + increment

        if (newProgress >= 100) {
          setIsComplete(true)
          clearInterval(messageInterval)
          clearInterval(progressInterval)
          return 100
        }

        return newProgress
      })
    }, 100)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
    }
  }, [currentPhase, initialComplete])

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Animated spinner or checkmark */}
      <div className="flex justify-center items-center">
        {isComplete ? (
          <CheckCircle className="h-16 w-16 text-primary animate-in zoom-in duration-500" />
        ) : (
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        )}
      </div>

      {/* Loading message */}
      <div className="flex flex-col items-center max-w-2xl mx-auto px-4">
        {/* Main message - hero text */}
        <h2 className="font-petrona text-2xl font-normal text-primary leading-tight mb-6">
          {currentPhase.messages[messageIndex]}
        </h2>

        {/* Formula - clean and readable */}
        <div className="mb-6">
          <FormulaAnimation
            animationStyle="progress-synced"
            progress={progress}
            onResultClick={onReviewPlan}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-3">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-sm text-muted-foreground font-sans">
          <p>This takes about 2 minutes</p>
          <p className="font-medium">{Math.round(progress)}% complete</p>
        </div>
      </div>
    </div>
  )
}
