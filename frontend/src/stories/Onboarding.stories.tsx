import type { Meta, StoryObj } from '@storybook/react-vite'
import { Onboarding } from '@/pages/Onboarding'
import { BrowserRouter } from 'react-router-dom'

const meta = {
  title: 'Pages/Onboarding',
  component: Onboarding,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Onboarding>

export default meta
type Story = StoryObj<typeof meta>

export const AthleteProfile: Story = {
  args: {
    initialStep: 1,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 1: Athlete Profile - Collecting runner information and training background.',
      },
    },
  },
}

export const YourCycle: Story = {
  args: {
    initialStep: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 2: Your Cycle - Collecting menstrual cycle tracking information to sync training with hormonal phases.',
      },
    },
  },
}

export const RaceAndPlan: Story = {
  args: {
    initialStep: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Step 3: Race & Plan - Entering race details and generating personalized training plan. Note: To see plan length recommendations, complete Step 1 first.',
      },
    },
  },
}
