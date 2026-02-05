import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Subtle bounce animation for CTA button
const ctaBounceKeyframes = `
  @keyframes subtle-bounce {
    0%, 100% {
      transform: scale(1.05);
    }
    50% {
      transform: scale(1.08);
    }
  }
`

type AnimationStyle =
  | 'sequential-buildup'
  | 'phase-progressive'
  | 'sliding-elements'
  | 'card-flip'
  | 'math-equation'
  | 'progress-synced'
  | 'mixing-bowl'
  | 'converging-particles'

interface FormulaAnimationProps {
  animationStyle: AnimationStyle
  progress?: number // For progress-synced and phase-progressive (0-100)
  showProgressText?: boolean // Show progress percentage text (for demos)
  onResultClick?: () => void // Called when result is clicked at 100% completion
}

export function FormulaAnimation({ animationStyle, progress = 0, showProgressText = false, onResultClick }: FormulaAnimationProps) {
  const [visibleElements, setVisibleElements] = useState<number>(0)
  const [mixingPhase, setMixingPhase] = useState<'separate' | 'moving' | 'mixing' | 'result'>('separate')

  // Sequential build-up: show elements one by one
  useEffect(() => {
    if (animationStyle === 'sequential-buildup') {
      const intervals = [0, 500, 1000, 1500, 2000]
      intervals.forEach((delay, index) => {
        setTimeout(() => setVisibleElements(index + 1), delay)
      })
    }
  }, [animationStyle])

  // Phase-progressive: reveal based on progress
  useEffect(() => {
    if (animationStyle === 'phase-progressive') {
      if (progress >= 0) setVisibleElements(1) // Gemini 3 + Profile
      if (progress >= 20) setVisibleElements(2) // + Cycle
      if (progress >= 40) setVisibleElements(3) // + Preferences
      if (progress >= 90) setVisibleElements(5) // = Result
    }
  }, [animationStyle, progress])

  // Math equation: all visible immediately but with animation
  useEffect(() => {
    if (animationStyle === 'math-equation') {
      setVisibleElements(5)
    }
  }, [animationStyle])

  // Sliding, card-flip, progress-synced: show all but style differently
  useEffect(() => {
    if (['sliding-elements', 'card-flip', 'progress-synced'].includes(animationStyle)) {
      setVisibleElements(5)
    }
  }, [animationStyle])

  // Mixing bowl animation sequence
  useEffect(() => {
    if (animationStyle === 'mixing-bowl' || animationStyle === 'converging-particles') {
      setVisibleElements(5)
      setMixingPhase('separate')

      const timeout1 = setTimeout(() => setMixingPhase('moving'), 800)
      const timeout2 = setTimeout(() => setMixingPhase('mixing'), 2000)
      const timeout3 = setTimeout(() => setMixingPhase('result'), 3200)

      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
        clearTimeout(timeout3)
      }
    }
  }, [animationStyle])

  const elements = [
    { text: 'Gemini 3', active: progress >= 0 && progress < 20 },
    { text: 'Your Profile', active: progress >= 0 && progress < 20 },
    { text: 'Your Cycle', active: progress >= 20 && progress < 40 },
    { text: 'Your Training Preferences', active: progress >= 40 && progress < 100 },
    { text: 'Your HerPace Training Plan', active: progress >= 100 }
  ]

  const getElementClass = (index: number, isActive: boolean) => {
    const baseClass = 'transition-all duration-500 inline-block'

    switch (animationStyle) {
      case 'sequential-buildup':
        return cn(
          baseClass,
          visibleElements > index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )

      case 'phase-progressive':
        return cn(
          baseClass,
          visibleElements > index ? 'opacity-100 scale-100' : 'opacity-30 scale-95'
        )

      case 'sliding-elements':
        return cn(
          baseClass,
          'animate-in',
          index % 2 === 0 ? 'slide-in-from-left-10' : 'slide-in-from-right-10',
          'duration-700'
        )

      case 'card-flip':
        return cn(
          baseClass,
          'animate-in rotate-y-12 duration-700'
        )

      case 'math-equation':
        return cn(
          baseClass,
          'animate-bounce delay-' + (index * 100)
        )

      case 'progress-synced':
        return cn(
          baseClass,
          isActive ? 'text-primary font-semibold scale-105' : 'text-muted-foreground'
        )

      case 'mixing-bowl':
      case 'converging-particles':
        if (mixingPhase === 'separate') {
          return cn(baseClass, 'opacity-100')
        } else if (mixingPhase === 'moving') {
          return cn(baseClass, 'opacity-100 scale-90 translate-x-0 translate-y-0')
        } else if (mixingPhase === 'mixing') {
          return cn(baseClass, 'opacity-50 scale-75 blur-sm')
        } else {
          return cn(baseClass, 'opacity-0 scale-50')
        }

      default:
        return baseClass
    }
  }

  const getElementStyle = (index: number) => {
    if (animationStyle === 'math-equation' || animationStyle === 'card-flip') {
      return {
        animationDelay: `${index * 150}ms`
      }
    }
    return undefined
  }

  // Special rendering for mixing animations
  if (animationStyle === 'mixing-bowl' || animationStyle === 'converging-particles') {
    return (
      <>
        <style>{ctaBounceKeyframes}</style>
        <div className="text-center space-y-4">
        <div className="relative h-32 flex items-center justify-center">
          {/* Ingredients */}
          <div className={cn(
            'absolute transition-all duration-1000',
            mixingPhase === 'separate' && 'opacity-100',
            mixingPhase === 'moving' && 'opacity-100 scale-90',
            mixingPhase === 'mixing' && 'opacity-0 scale-75 blur-md',
            mixingPhase === 'result' && 'opacity-0 scale-50'
          )}>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">Gemini 3</span>
              <span className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">Your Profile</span>
              <span className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg font-medium">Your Cycle</span>
              <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium">Your Preferences</span>
            </div>
          </div>

          {/* Mixing effect */}
          {mixingPhase === 'mixing' && (
            <div className="absolute animate-pulse">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 opacity-75 blur-xl" />
            </div>
          )}

          {/* Result */}
          <div className={cn(
            'absolute transition-all duration-1000',
            mixingPhase === 'result' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}>
            <div className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg shadow-lg">
              ✨ Your HerPace Training Plan
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {mixingPhase === 'separate' && 'Gathering ingredients...'}
          {mixingPhase === 'moving' && 'Combining elements...'}
          {mixingPhase === 'mixing' && 'Mixing together...'}
          {mixingPhase === 'result' && 'Plan created!'}
        </p>
      </div>
      </>
    )
  }

  return (
    <>
      <style>{ctaBounceKeyframes}</style>
      <div className="text-center space-y-2 w-full max-w-full">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-6 text-sm font-normal font-sans text-center">
        {/* Gemini 3 */}
        {(visibleElements >= 1 || animationStyle === 'progress-synced') && (
          <span className={getElementClass(0, elements[0].active)} style={getElementStyle(0)}>
            Gemini 3
          </span>
        )}

        {/* + Your Profile */}
        {(visibleElements >= 1 || animationStyle === 'progress-synced') && (
          <>
            <span className="text-muted-foreground font-normal">+</span>
            <span className={getElementClass(1, elements[1].active)} style={getElementStyle(1)}>
              Your Profile
            </span>
          </>
        )}

        {/* + Your Cycle */}
        {(visibleElements >= 2 || animationStyle === 'progress-synced') && (
          <>
            <span className="text-muted-foreground font-normal">+</span>
            <span className={getElementClass(2, elements[2].active)} style={getElementStyle(2)}>
              Your Cycle
            </span>
          </>
        )}

        {/* + Your Training Preferences */}
        {(visibleElements >= 3 || animationStyle === 'progress-synced') && (
          <>
            <span className="text-muted-foreground font-normal">+</span>
            <span className={getElementClass(3, elements[3].active)} style={getElementStyle(3)}>
              Your Training Preferences
            </span>
          </>
        )}

        {/* = Your HerPace Training Plan */}
        {(visibleElements >= 5 || animationStyle === 'progress-synced') && (
          <>
            <span className="text-muted-foreground font-normal text-lg">=</span>
            {progress >= 100 && onResultClick ? (
              <button
                onClick={onResultClick}
                className={cn(
                  'transition-all duration-500',
                  'px-6 py-3 rounded-lg',
                  'bg-primary text-primary-foreground',
                  'font-semibold text-base',
                  'hover:scale-110 hover:shadow-lg',
                  'active:scale-100',
                  'cursor-pointer',
                  'ml-2',
                  'shadow-md'
                )}
                style={{
                  animation: 'subtle-bounce 2s ease-in-out infinite'
                }}
              >
                Review Training Plan
              </button>
            ) : (
              <span
                className={cn(
                  getElementClass(4, elements[4].active),
                  'font-semibold text-primary'
                )}
                style={getElementStyle(4)}
              >
                Your HerPace Training Plan
              </span>
            )}
          </>
        )}
      </div>

      {animationStyle === 'progress-synced' && showProgressText && (
        <p className="text-xs text-muted-foreground">
          Progress: {Math.round(progress)}% (active element highlighted)
        </p>
      )}
      </div>
    </>
  )
}
