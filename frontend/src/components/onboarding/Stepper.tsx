import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  number: number
  title: string
  description?: string
}

interface StepperProps {
  currentStep: number
  steps: Step[]
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <div key={step.number} className="flex-1 flex items-center">
              {/* Step circle and content */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative flex items-center justify-center">
                  {/* Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      isUpcoming && 'bg-muted text-muted-foreground border-2 border-border'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                </div>

                {/* Step title and description */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      (isActive || isCompleted) && 'text-foreground',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line (not shown after last step) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                  style={{ marginTop: '-2.5rem' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
