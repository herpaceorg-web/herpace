import * as React from 'react'
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
    <div className="w-full p-6">
      <div className="w-2/3 mx-auto">
        {/* Row 1: Circles and connector lines */}
        <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <React.Fragment key={step.number}>
              {/* Step circle */}
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

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-4 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Row 2: Step titles and descriptions */}
      <div className="flex items-start mt-2">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isActive = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <React.Fragment key={step.number}>
              {/* Text container matching circle position */}
              <div className="flex justify-center" style={{ width: '40px' }}>
                <div className="text-center whitespace-nowrap">
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

              {/* Spacer matching connector line */}
              {index < steps.length - 1 && <div className="flex-1 mx-4" />}
            </React.Fragment>
          )
        })}
      </div>
      </div>
    </div>
  )
}
