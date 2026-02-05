import type { Meta, StoryObj } from '@storybook/react-vite'
import { RaceStep } from '@/components/onboarding/RaceStep'

const meta = {
  title: 'Onboarding/RaceStep',
  component: RaceStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[600px] max-w-full p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RaceStep>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
  },
}

export const WithDefaultValues: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      raceName: 'Chicago Marathon 2026',
      location: 'Chicago, IL',
      raceDate: new Date(2026, 9, 11), // October 11, 2026
      trainingStartDate: new Date(2026, 5, 1), // June 1, 2026
      distanceType: 'Marathon',
      distance: 42.195,
      goalTime: '3:45:00',
      raceCompletionGoal: 'Complete my first marathon and qualify for Boston!',
    },
  },
}

export const HalfMarathonExample: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      raceName: 'Brooklyn Half Marathon',
      location: 'Brooklyn, NY',
      raceDate: new Date(2026, 4, 16), // May 16, 2026
      trainingStartDate: new Date(2026, 1, 1), // February 1, 2026
      distanceType: 'HalfMarathon',
      distance: 21.0975,
      goalTime: '1:45:00',
    },
  },
}

export const FiveKExample: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
    onBack: () => {
      console.log('Back button clicked')
      alert('Back button clicked!')
    },
    defaultValues: {
      raceName: 'Spring 5K Fun Run',
      trainingStartDate: new Date(2026, 2, 15), // March 15, 2026
      raceDate: new Date(2026, 3, 20), // April 20, 2026
      distanceType: 'FiveK',
      distance: 5,
      raceCompletionGoal: 'Beat my personal record and have fun!',
    },
  },
}
