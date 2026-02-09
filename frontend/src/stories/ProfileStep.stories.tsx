import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProfileStep } from '@/components/onboarding/ProfileStep'

const meta = {
  title: 'Onboarding/ProfileStep',
  component: ProfileStep,
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
} satisfies Meta<typeof ProfileStep>

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
      name: 'Jane Doe',
      dateOfBirth: new Date(1990, 5, 15), // June 15, 1990
      fitnessLevel: 'Intermediate',
      typicalWeeklyMileage: 25,
      distanceUnit: 'Miles',
    },
  },
}

export const WithoutBackButton: Story = {
  args: {
    onComplete: (data) => {
      console.log('Form submitted:', data)
      alert('Form submitted! Check console for data.')
    },
  },
}
