import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { GeneratingPlanStep } from '@/components/onboarding/GeneratingPlanStep'
import { Card } from '@/components/ui/card'

const meta = {
  title: 'Onboarding/GeneratingPlanStep',
  component: GeneratingPlanStep,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading screen displayed while the AI generates a personalized training plan. Features 5 distinct generation phases that showcase HerPace\'s unique cycle-aware approach: Profile Analysis → Cycle Integration → Workout Planning → Cycle Optimization → Taper & Finalization. Each phase has multiple rotating messages, creating a sense of real progress.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <div className="p-6">
            <Story />
          </div>
        </Card>
      </div>
    ),
  ],
} satisfies Meta<typeof GeneratingPlanStep>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Shows the complete plan generation experience with 5 phases:\n\n**Phase 1 (0-20%):** Profile Analysis\n**Phase 2 (20-40%):** Cycle Integration - Syncing with menstrual cycle\n**Phase 3 (40-70%):** Workout Planning - Creating weekly structure\n**Phase 4 (70-90%):** Cycle Optimization - Adjusting for hormone phases\n**Phase 5 (90-100%):** Taper & Finalization\n\nMessages rotate every 6 seconds within each phase, and progress indicators show which phase is active. When generation reaches 100%, the spinner transforms into a checkmark with a confirmation message.',
      },
    },
  },
}

export const WithCTA: Story = {
  args: {},
  render: () => {
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [key, setKey] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = 100 / (15 * 10) // 15 seconds total
          const newProgress = prev + increment

          if (newProgress >= 100) {
            setIsComplete(true)
            clearInterval(interval)

            // Wait 5 seconds at completion, then restart
            setTimeout(() => {
              setKey((k) => k + 1)
              setProgress(0)
              setIsComplete(false)
            }, 5000)

            return 100
          }

          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }, [key])

    return (
      <GeneratingPlanStep
        key={key}
        initialProgress={progress}
        initialComplete={isComplete}
        onReviewPlan={() => console.log('Review plan clicked')}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: '**Accelerated animation** (15 seconds instead of 2 minutes) showing the complete loading experience with CTA transformation. Watch how:\n\n- Spinner animates while progress increases\n- Formula highlights different elements as phases progress\n- At 100%: Spinner transforms to checkmark, "Your HerPace Training Plan" becomes "Review Training Plan" button\n\nLoops automatically after 5-second pause.',
      },
    },
  },
}

export const Completed: Story = {
  args: {
    initialProgress: 100,
    initialComplete: true,
    onReviewPlan: () => console.log('Review plan clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the completed state after plan generation finishes. The spinner has transformed into a checkmark, the progress bar is at 100%, and the final confirmation message "Your HerPace Training Plan is Ready!" is displayed. The formula result "Your HerPace Training Plan" transforms into an interactive button "Review Training Plan" that the user can click to view their plan summary.',
      },
    },
  },
}

export const InAppBrokenVariant: Story = {
  args: {
    initialProgress: 100,
    initialComplete: true,
    // No onReviewPlan prop - replicates the bug in the actual app
  },
  parameters: {
    docs: {
      description: {
        story: '**BUG REPRODUCTION (Static):** This story replicates the broken behavior in the actual app at `Onboarding.tsx:338` where `GeneratingPlanStep` is called without the `onReviewPlan` prop. Notice that when progress reaches 100%, the "Review Training Plan" button does NOT appear - it just shows static text "Your HerPace Training Plan" instead. This is because `FormulaAnimation` only shows the button when BOTH `progress >= 100` AND `onResultClick` prop are provided.',
      },
    },
  },
}

export const InAppBrokenAnimated: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [key, setKey] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = 100 / (15 * 10) // 15 seconds total
          const newProgress = prev + increment

          if (newProgress >= 100) {
            setIsComplete(true)
            clearInterval(interval)

            // Wait 5 seconds at completion, then restart
            setTimeout(() => {
              setKey((k) => k + 1)
              setProgress(0)
              setIsComplete(false)
            }, 5000)

            return 100
          }

          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }, [key])

    return (
      <GeneratingPlanStep
        key={key}
        initialProgress={progress}
        initialComplete={isComplete}
        // No onReviewPlan prop - replicates the bug!
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: '**BUG REPRODUCTION (Animated):** Same as `WithCTA` story but WITHOUT the `onReviewPlan` prop. Watch the full 15-second animation and notice that at 100% completion, the "Review Training Plan" button never appears - it stays as static text. This exactly replicates what users see in the actual app. Loops automatically after 5-second pause.',
      },
    },
  },
}
