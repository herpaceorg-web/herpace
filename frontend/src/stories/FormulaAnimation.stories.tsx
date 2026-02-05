import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { FormulaAnimation } from '@/components/onboarding/FormulaAnimation'

const meta = {
  title: 'Onboarding/FormulaAnimation',
  component: FormulaAnimation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Different animation styles for the plan generation formula: Gemini 3 + Your Profile + Your Cycle + Your Training Preferences = Your HerPace Training Plan',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[700px] max-w-full p-12 bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormulaAnimation>

export default meta
type Story = StoryObj<typeof meta>

// Helper component to simulate progress
const ProgressSimulator = ({ animationStyle }: { animationStyle: any }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0 // Loop
        return prev + 1
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return <FormulaAnimation animationStyle={animationStyle} progress={progress} showProgressText={true} />
}

export const SequentialBuildUp: Story = {
  args: {
    animationStyle: 'sequential-buildup',
    progress: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Elements appear one by one with a staggered fade-in effect (500ms delay between each). Simple and clear progression.',
      },
    },
  },
}

export const PhaseProgressive: Story = {
  render: () => <ProgressSimulator animationStyle="phase-progressive" />,
  parameters: {
    docs: {
      description: {
        story: 'Formula builds as phases complete. Elements appear when their corresponding phase starts: Profile (0%), Cycle (20%), Preferences (40%), Result (90%). **This syncs with actual plan generation progress!**',
      },
    },
  },
}

export const SlidingElements: Story = {
  args: {
    animationStyle: 'sliding-elements',
    progress: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Each element slides in from alternating sides (left/right). Dynamic and playful feel.',
      },
    },
  },
}

export const CardFlip: Story = {
  args: {
    animationStyle: 'card-flip',
    progress: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Elements flip into view like cards being revealed. Engaging and polished.',
      },
    },
  },
}

export const MathEquation: Story = {
  args: {
    animationStyle: 'math-equation',
    progress: 50,
  },
  parameters: {
    docs: {
      description: {
        story: 'Elements bounce into position like puzzle pieces snapping together. Most dynamic and fun.',
      },
    },
  },
}

export const ProgressSynced: Story = {
  render: () => <ProgressSimulator animationStyle="progress-synced" />,
  parameters: {
    docs: {
      description: {
        story: 'Full formula visible but currently active element is highlighted based on progress. Clear indication of what\'s being worked on. **Shows real-time progress!**',
      },
    },
  },
}

export const ProgressSyncedWithButton: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)
    const [hasLooped, setHasLooped] = useState(false)

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (!hasLooped) {
              setHasLooped(true)
              // Pause at 100% for 3 seconds before restarting
              setTimeout(() => {
                setProgress(0)
                setHasLooped(false)
              }, 3000)
            }
            return 100
          }
          return prev + 1
        })
      }, 100)

      return () => clearInterval(interval)
    }, [hasLooped])

    return (
      <div className="space-y-4">
        <FormulaAnimation
          animationStyle="progress-synced"
          progress={progress}
          showProgressText={true}
          onResultClick={() => console.log('Review plan clicked!')}
        />
        <p className="text-xs text-center text-muted-foreground">
          {progress < 20 && 'Phase 1: Gemini 3 + Your Profile highlighted'}
          {progress >= 20 && progress < 40 && 'Phase 2: Your Cycle highlighted'}
          {progress >= 40 && progress < 100 && 'Phase 3: Your Training Preferences highlighted'}
          {progress >= 100 && 'Complete: Button appears!'}
        </p>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '**Watch the complete animation sequence!** Shows how the formula highlighting progresses through each phase (0-20%, 20-40%, 40-100%) and then at 100% the result transforms into the interactive "Review my HerPace Plan" button. Animation completes in 10 seconds and loops automatically after a 3-second pause.',
      },
    },
  },
}

export const MixingBowl: Story = {
  args: {
    animationStyle: 'mixing-bowl',
    progress: 0,
  },
  parameters: {
    docs: {
      description: {
        story: '**NEW! Mixing metaphor** - Ingredients (Gemini 3, Profile, Cycle, Preferences) appear as colored badges, converge toward center, blur together in a mixing effect, then the final plan materializes from the blend. Most visual and metaphorical approach!',
      },
    },
  },
}

export const ConvergingParticles: Story = {
  args: {
    animationStyle: 'converging-particles',
    progress: 0,
  },
  parameters: {
    docs: {
      description: {
        story: '**NEW! Similar to Mixing Bowl** - Same mixing metaphor with subtle visual differences. Elements converge and blend together to create the final result.',
      },
    },
  },
}
