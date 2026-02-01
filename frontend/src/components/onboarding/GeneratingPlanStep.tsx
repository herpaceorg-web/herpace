import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const LOADING_MESSAGES = [
  'Analyzing your profile...',
  'Calculating optimal training schedule...',
  'Personalizing for your cycle...',
  'Almost ready...'
]

export function GeneratingPlanStep() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000) // Rotate messages every 3 seconds

    return () => clearInterval(interval)
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
