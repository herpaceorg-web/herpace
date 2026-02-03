import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

const LOADING_MESSAGES = [
  'Analyzing your profile...',
  'Calculating optimal training schedule...',
  'Personalizing for your cycle...',
  'Almost ready...'
]

export function GeneratingPlanStep() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Rotate messages every 3 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)

    // Smoothly increment progress from 0 to 100 over ~120 seconds
    // Update every 100ms for smooth animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Increment by ~0.083% each 100ms to reach 100% in 120 seconds
        const increment = 100 / (120 * 10)
        const newProgress = prev + increment
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 100)

    return () => {
      clearInterval(messageInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Animated spinner */}
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>

      {/* Loading message */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {LOADING_MESSAGES[messageIndex]}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          We're creating your personalized training plan using AI. This may take up to 2 minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {LOADING_MESSAGES.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === messageIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
